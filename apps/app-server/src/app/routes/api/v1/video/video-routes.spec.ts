import { randomBytes } from 'crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import Fastify, { FastifyInstance } from 'fastify';
import { startDbServer, startPostgres, DbServerChild, ThrowawayPostgres } from '../../../../grpc/test-support';

/*
 * Video routes against the built db-server (npx nx build db-server first) over a throwaway postgres.
 * JWT_SECRET and passwords are generated here, never literals.
 */
jest.setTimeout(240000);

const SECRET = randomBytes(32).toString('hex');
const rand = (p: string) => `${p}_${randomBytes(4).toString('hex')}`;
const savedEnv = { s: process.env.JWT_SECRET, a: process.env.DB_GRPC_ADDR, c: process.env.COOKIE_SECURE };

let pg: ThrowawayPostgres;
let child: DbServerChild;
let f: FastifyInstance;
let storage: string;
let parent: string;
let services: typeof import('../../../../grpc/services');

const post = (url: string, payload?: object, cookie?: string) =>
  f.inject({ method: 'POST', url, payload, headers: cookie ? { cookie } : {} });

async function login() {
  const username = rand('user');
  const password = randomBytes(12).toString('hex');
  const reg = await post('/api/v1/auth/register', { username, password });
  expect(reg.statusCode).toBe(201);
  const res = await post('/api/v1/auth/login', { username, password });
  expect(res.statusCode).toBe(200);
  const sc = ([] as string[]).concat((res.headers['set-cookie'] as string[] | string) ?? []).find((c) => c.startsWith('nvs_session='));
  return { user_id: reg.json().user_id as string, cookie: sc!.split(';')[0] };
}

const getRow = (video_id: string, owner_id: string) =>
  services.getVideoForOwner({ requestObject: { video_id, owner_id }, callBack: () => undefined, errorHandler: () => undefined });

beforeAll(async () => {
  // own parent dir so a '../x' escape would be visible beside the storage dir
  parent = mkdtempSync(join(tmpdir(), 'video-routes-spec-'));
  storage = join(parent, 'storage');
  mkdirSync(storage);
  pg = await startPostgres('app-server-video-spec');
  child = await startDbServer({ DATABASE_URL: pg.url, DIRECT_URL: pg.url, VIDEO_STORAGE_DIR: storage });
  process.env.JWT_SECRET = SECRET;
  process.env.DB_GRPC_ADDR = child.grpcAddr;
  delete process.env.COOKIE_SECURE;
  const { app } = await import('../../../../app');
  services = await import('../../../../grpc/services');
  f = Fastify({ logger: false });
  f.register(app);
  await f.ready();
});

afterAll(async () => {
  await f?.close();
  (await import('../../../../grpc')).default.close();
  await child?.stop();
  pg?.stop();
  for (const [k, v] of [['JWT_SECRET', savedEnv.s], ['DB_GRPC_ADDR', savedEnv.a], ['COOKIE_SECURE', savedEnv.c]] as const) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe('video routes', () => {
  it('answer 401 unauthenticated with no cookie', async () => {
    const a = await post('/api/v1/video/create', { video_id: rand('v'), start_time: 1000 });
    expect(a.statusCode).toBe(401);
    expect(a.json().error.code).toBe('unauthenticated');
    const b = await post('/api/v1/video/some_video', { has_streaming_started: true });
    expect(b.statusCode).toBe(401);
    expect(b.json().error.code).toBe('unauthenticated');
  });

  it('stamps the caller as owner, ignoring a body owner', async () => {
    const u = await login();
    const video_id = rand('own');
    const res = await post('/api/v1/video/create', { video_id, start_time: 1000, owner_id: 'someone-else' }, u.cookie);
    expect(res.statusCode).toBe(200);
    expect(res.json().video_id).toBe(video_id);
    expect(res.json().owner_id).toBe(u.user_id);
    expect(res.json().start_time).toBe(1000);
    expect(res.json().is_streaming).toBe(false);
    const body = res.json();
    for (const k of ['end_time', 'title', 'duration_s']) {
      expect(body).toHaveProperty(k, null);
    }
    expect((await getRow(video_id, u.user_id))?.owner_id).toBe(u.user_id);
  });

  it('non-owner update answers 404 not_found, owner row unchanged, owner update succeeds', async () => {
    const a = await login();
    const b = await login();
    const video_id = rand('upd');
    expect((await post('/api/v1/video/create', { video_id, start_time: 1000 }, a.cookie)).statusCode).toBe(200);
    const before = await getRow(video_id, a.user_id);

    const bad = await post(`/api/v1/video/${video_id}`, { has_streaming_started: true }, b.cookie);
    expect(bad.statusCode).toBe(404);
    expect(bad.json().error.code).toBe('not_found');
    expect(await getRow(video_id, a.user_id)).toEqual(before);

    const ok = await post(`/api/v1/video/${video_id}`, { has_streaming_started: true }, a.cookie);
    expect(ok.statusCode).toBe(200);
    expect(ok.json().update_complete).toBe(true);
    expect(ok.json().version).toBe('v1');
    expect((await getRow(video_id, a.user_id))?.is_streaming).toBe(true);
  });

  it('rejects a bad video_id with 400 invalid_input and creates no directory', async () => {
    const u = await login();
    const before = readdirSync(storage).sort();
    for (const video_id of ['../x', 'a/b', '', 'x'.repeat(65)]) {
      const res = await post('/api/v1/video/create', { video_id, start_time: 1000 }, u.cookie);
      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('invalid_input');
    }
    expect(existsSync(join(parent, 'x'))).toBe(false);
    expect(readdirSync(parent)).toEqual(['storage']);
    expect(readdirSync(storage).sort()).toEqual(before);
    const upd = await post('/api/v1/video/bad.id', { has_streaming_started: true }, u.cookie);
    expect(upd.statusCode).toBe(400);
    expect(upd.json().error.code).toBe('invalid_input');
  });

  it('answers 500 internal_error when the handler throws a non-validation error', async () => {
    const u = await login();
    const mod = await import('../../../../grpc/services/updateVideoStreamingState');
    const spy = jest.spyOn(mod, 'updateVideoStreamingState').mockRejectedValue(new Error('boom'));
    try {
      const res = await post(`/api/v1/video/${rand('thr')}`, { has_streaming_started: true }, u.cookie);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBe(500);
      expect(res.json().error.code).toBe('internal_error');
    } finally {
      spy.mockRestore();
    }
  });

  it('answers 409 video_exists for a duplicate video_id and db-server stays up', async () => {
    const u = await login();
    const video_id = rand('dup');
    expect((await post('/api/v1/video/create', { video_id, start_time: 1000 }, u.cookie)).statusCode).toBe(200);
    const dup = await post('/api/v1/video/create', { video_id, start_time: 2000 }, u.cookie);
    expect(dup.statusCode).toBe(409);
    expect(dup.json().error.code).toBe('video_exists');
    expect(child.proc.exitCode).toBeNull();
    const again = await post('/api/v1/video/create', { video_id: rand('after'), start_time: 1000 }, u.cookie);
    expect(again.statusCode).toBe(200);
  });
});
