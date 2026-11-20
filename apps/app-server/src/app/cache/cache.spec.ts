import { execFileSync } from 'child_process';
import { randomBytes } from 'crypto';
import Fastify, { FastifyInstance } from 'fastify';
import Redis from 'ioredis';
import * as jwt from 'jsonwebtoken';
import { Writable } from 'stream';
import { startDbServer, startPostgres, DbServerChild, ThrowawayPostgres } from '../grpc/test-support';

/*
 * Cache wiring (auth hook user:v1, library lib:v1 + X-Cache, video invalidation) against the built
 * db-server over a throwaway postgres and a throwaway redis:7. Secrets are generated here, never literals.
 */
jest.setTimeout(240000);

const SECRET = randomBytes(32).toString('hex');
const rand = (p: string) => `${p}_${randomBytes(4).toString('hex')}`;
const savedEnv = { s: process.env.JWT_SECRET, a: process.env.DB_GRPC_ADDR, c: process.env.COOKIE_SECURE, r: process.env.REDIS_URL };

const ORBSTACK_SOCKET = 'unix:///Users/xavier/.orbstack/run/docker.sock';
function dockerEnv(): NodeJS.ProcessEnv {
  if (process.env.DOCKER_HOST) return process.env;
  try {
    execFileSync('docker', ['version', '--format', '{{.Server.Version}}'], { stdio: 'pipe' });
    return process.env;
  } catch {
    return { ...process.env, DOCKER_HOST: ORBSTACK_SOCKET };
  }
}
const denv = dockerEnv();
const docker = (args: string[]) => execFileSync('docker', args, { env: denv, encoding: 'utf8', stdio: 'pipe' }).trim();
const redisName = `st6-u11-redis-${randomBytes(4).toString('hex')}`;

let pg: ThrowawayPostgres;
let child: DbServerChild;
let f: FastifyInstance;
let admin: Redis;
let closeCache: () => Promise<void>;

const post = (url: string, payload?: object, cookie?: string) =>
  f.inject({ method: 'POST', url, payload, headers: cookie ? { cookie } : {} });
const getLibrary = (cookie?: string) =>
  f.inject({ method: 'GET', url: '/api/v1/library', headers: cookie ? { cookie } : {} });
const ids = (res: { json: () => { videos: { video_id: string }[] } }) => res.json().videos.map((v) => v.video_id).sort();

async function login() {
  const username = rand('user');
  const password = randomBytes(12).toString('hex');
  const reg = await post('/api/v1/auth/register', { username, password });
  expect(reg.statusCode).toBe(201);
  const res = await post('/api/v1/auth/login', { username, password });
  expect(res.statusCode).toBe(200);
  const sc = ([] as string[]).concat((res.headers['set-cookie'] as string[] | string) ?? []).find((c) => c.startsWith('nvs_session='));
  return { user_id: reg.json().user_id as string, username, cookie: sc!.split(';')[0] };
}

const createVideo = async (cookie: string) => {
  const video_id = rand('vid');
  const res = await post('/api/v1/video/create', { video_id, start_time: 1000 }, cookie);
  expect(res.statusCode).toBe(200);
  return video_id;
};

beforeAll(async () => {
  docker(['run', '-d', '--name', redisName, '-p', '127.0.0.1::6379', 'redis:7']);
  const rport = docker(['port', redisName, '6379/tcp']).split('\n')[0].split(':').pop();
  process.env.REDIS_URL = `redis://127.0.0.1:${rport}`;
  admin = new Redis(process.env.REDIS_URL);
  for (let i = 0; i < 30; i++) {
    try {
      if ((await admin.ping()) === 'PONG') break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  pg = await startPostgres('app-server-cache-spec');
  child = await startDbServer({ DATABASE_URL: pg.url, DIRECT_URL: pg.url });
  process.env.JWT_SECRET = SECRET;
  process.env.DB_GRPC_ADDR = child.grpcAddr;
  delete process.env.COOKIE_SECURE;
  const { app } = await import('../app');
  closeCache = (await import('./index')).closeClient;
  const stream = new Writable({ write(_c, _e, cb) { cb(); } });
  f = Fastify({ logger: { level: 'info', stream } });
  f.register(app);
  await f.ready();
});

afterAll(async () => {
  await f?.close();
  await closeCache?.();
  admin?.disconnect();
  (await import('../grpc')).default.close();
  await child?.stop();
  pg?.stop();
  try {
    docker(['rm', '-f', redisName]);
  } catch {
    /* already gone */
  }
  for (const [k, v] of [['JWT_SECRET', savedEnv.s], ['DB_GRPC_ADDR', savedEnv.a], ['COOKIE_SECURE', savedEnv.c], ['REDIS_URL', savedEnv.r]] as const) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe('cache wiring', () => {
  it('serves MISS then HIT with the same body, and keeps Cache-Control private, no-store', async () => {
    const a = await login();
    const v1 = await createVideo(a.cookie);
    const first = await getLibrary(a.cookie);
    expect(first.statusCode).toBe(200);
    expect(first.headers['x-cache']).toBe('MISS');
    expect(first.headers['cache-control']).toBe('private, no-store');
    const second = await getLibrary(a.cookie);
    expect(second.headers['x-cache']).toBe('HIT');
    expect(second.headers['cache-control']).toBe('private, no-store');
    expect(second.json()).toEqual(first.json());
    expect(ids(second)).toEqual([v1]);
    const ttl = await admin.ttl(`lib:v1:${a.user_id}`);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(60);
  });

  it('caches user:v1 without password_hash', async () => {
    const a = await login();
    await getLibrary(a.cookie);
    const raw = await admin.get(`user:v1:${a.user_id}`);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toEqual({ user_id: a.user_id, username: a.username });
    expect(raw).not.toMatch(/password/);
  });

  it('clears lib:v1:{user_id} on video create and on stream-state change', async () => {
    const a = await login();
    const v1 = await createVideo(a.cookie);
    await getLibrary(a.cookie);
    expect(await admin.exists(`lib:v1:${a.user_id}`)).toBe(1);

    const v2 = await createVideo(a.cookie);
    expect(await admin.exists(`lib:v1:${a.user_id}`)).toBe(0);
    const afterCreate = await getLibrary(a.cookie);
    expect(afterCreate.headers['x-cache']).toBe('MISS');
    expect(ids(afterCreate)).toEqual([v1, v2].sort());

    expect(await admin.exists(`lib:v1:${a.user_id}`)).toBe(1);
    const upd = await post(`/api/v1/video/${v1}`, { has_streaming_started: true }, a.cookie);
    expect(upd.statusCode).toBe(200);
    expect(await admin.exists(`lib:v1:${a.user_id}`)).toBe(0);
    expect((await getLibrary(a.cookie)).headers['x-cache']).toBe('MISS');
  });

  it('answers 401 for a tampered or expired cookie while the caches are warm', async () => {
    const a = await login();
    await createVideo(a.cookie);
    expect((await getLibrary(a.cookie)).headers['x-cache']).toBe('MISS');
    expect((await getLibrary(a.cookie)).headers['x-cache']).toBe('HIT');
    expect(await admin.exists(`user:v1:${a.user_id}`)).toBe(1);

    const token = a.cookie.split('=')[1];
    const tampered = `nvs_session=${token.slice(0, -2)}${token.endsWith('AA') ? 'BB' : 'AA'}`;
    const wrongKey = `nvs_session=${jwt.sign({}, randomBytes(32).toString('hex'), { algorithm: 'HS256', subject: a.user_id, expiresIn: 60 })}`;
    const expired = `nvs_session=${jwt.sign({}, SECRET, { algorithm: 'HS256', subject: a.user_id, expiresIn: -10 })}`;
    for (const cookie of [tampered, wrongKey, expired]) {
      const res = await getLibrary(cookie);
      expect(res.statusCode).toBe(401);
      expect(res.headers['x-cache']).toBeUndefined();
      expect(res.json().videos).toBeUndefined();
    }
  });

  it('keeps users apart: B gets only B rows with MISS and never A user entry', async () => {
    const a = await login();
    const b = await login();
    const a1 = await createVideo(a.cookie);
    const b1 = await createVideo(b.cookie);
    await getLibrary(a.cookie);
    expect((await getLibrary(a.cookie)).headers['x-cache']).toBe('HIT');

    const resB = await getLibrary(b.cookie);
    expect(resB.headers['x-cache']).toBe('MISS');
    expect(ids(resB)).toEqual([b1]);
    expect(ids(resB)).not.toContain(a1);
    const userB = JSON.parse((await admin.get(`user:v1:${b.user_id}`)) as string);
    expect(userB.user_id).toBe(b.user_id);
    expect(userB.username).toBe(b.username);
    expect(userB.username).not.toBe(a.username);
  });

  it('falls open when Redis is stopped: library answers from the database with MISS', async () => {
    const a = await login();
    const v1 = await createVideo(a.cookie);
    expect((await getLibrary(a.cookie)).headers['x-cache']).toBe('MISS');
    expect((await getLibrary(a.cookie)).headers['x-cache']).toBe('HIT');
    docker(['stop', redisName]);
    for (let i = 0; i < 2; i++) {
      const res = await getLibrary(a.cookie);
      expect(res.statusCode).toBe(200);
      expect(res.headers['x-cache']).toBe('MISS');
      expect(ids(res)).toEqual([v1]);
    }
    const created = await post('/api/v1/video/create', { video_id: rand('vid'), start_time: 1 }, a.cookie);
    expect(created.statusCode).toBe(200);
  });
});
