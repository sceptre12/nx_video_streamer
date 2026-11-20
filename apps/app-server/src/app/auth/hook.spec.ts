import { execFileSync } from 'child_process';
import { createHmac, randomBytes } from 'crypto';
import Fastify, { FastifyInstance } from 'fastify';
import * as jwt from 'jsonwebtoken';
import cookiePlugin from '../plugins/cookie';
import jwtAuthPlugin from '../plugins/jwt-auth';
import * as cache from '../cache';
import * as services from '../grpc/services/users';
import { SESSION_COOKIE } from './config';

/* No docker or db-server needed: the hook only verifies the cookie. JWT_SECRET is generated here. */
jest.setTimeout(60000);

const SECRET = randomBytes(32).toString('hex');
const USER_ID = 'user-' + randomBytes(4).toString('hex');
const savedSecret = process.env.JWT_SECRET;

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const forge = (alg: string, secret: string, payload: object) => {
  const head = `${b64({ alg, typ: 'JWT' })}.${b64(payload)}`;
  if (alg === 'none') return `${head}.`;
  return `${head}.${createHmac(alg === 'HS512' ? 'sha512' : 'sha256', secret).update(head).digest('base64url')}`;
};
const claims = (exp = Math.floor(Date.now() / 1000) + 600) => ({ sub: USER_ID, iat: Math.floor(Date.now() / 1000), exp });

async function stubApp(): Promise<FastifyInstance> {
  process.env.JWT_SECRET = SECRET;
  const f = Fastify();
  await f.register(cookiePlugin);
  await f.register(jwtAuthPlugin);
  f.get('/api/v1/ping', async (req) => ({ user: req.sessionUserId }));
  f.get('/api/v1/library', async () => ({ ok: true }));
  f.post('/api/v1/auth/logout', async (_req, reply) => reply.status(204).send());
  f.get('/open', async () => ({ ok: true }));
  await f.ready();
  return f;
}

const withCookie = (f: FastifyInstance, token: string, url = '/api/v1/ping') =>
  f.inject({ method: 'GET', url, headers: { cookie: `${SESSION_COOKIE}=${token}` } });

afterAll(() => {
  if (savedSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = savedSecret;
});

describe('auth hook', () => {
  let f: FastifyInstance;
  beforeAll(async () => { f = await stubApp(); });
  afterAll(async () => { await f.close(); });

  it('answers 401 unauthenticated on a protected route without a cookie', async () => {
    const res = await f.inject({ method: 'GET', url: '/api/v1/ping' });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ version: 'v1', error: { code: 'unauthenticated', message: expect.any(String) } });
  });

  it('protects every /api/v1 route by default, leaves public routes and non-api routes open', async () => {
    expect((await f.inject({ method: 'GET', url: '/api/v1/library' })).statusCode).toBe(401);
    expect((await f.inject({ method: 'POST', url: '/api/v1/auth/logout' })).statusCode).toBe(204);
    expect((await f.inject({ method: 'GET', url: '/open' })).statusCode).toBe(200);
  });

  it('accepts a valid HS256 token and exposes the user id', async () => {
    const token = jwt.sign({}, SECRET, { algorithm: 'HS256', subject: USER_ID, expiresIn: 60 });
    const res = await withCookie(f, token);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ user: USER_ID });
  });

  it.each([
    ['tampered signature', () => { const t = forge('HS256', SECRET, claims()); return t.slice(0, -2) + (t.endsWith('AA') ? 'BB' : 'AA'); }],
    ['tampered payload', () => { const [h, , s] = forge('HS256', SECRET, claims()).split('.'); return `${h}.${b64({ ...claims(), sub: 'other' })}.${s}`; }],
    ['expired', () => forge('HS256', SECRET, claims(Math.floor(Date.now() / 1000) - 60))],
    ['alg none', () => forge('none', '', claims())],
    ['HS512', () => forge('HS512', SECRET, claims())],
    ['wrong secret', () => forge('HS256', randomBytes(32).toString('hex'), claims())],
    ['no exp', () => jwt.sign({}, SECRET, { algorithm: 'HS256', subject: USER_ID })],
    ['no sub', () => jwt.sign({}, SECRET, { algorithm: 'HS256', expiresIn: 60 })],
    ['garbage', () => 'not-a-jwt'],
  ])('answers 401 unauthenticated for a %s token', async (_name, make) => {
    const res = await withCookie(f, make());
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('unauthenticated');
  });
});

describe('startup and cors', () => {
  afterEach(() => { process.env.JWT_SECRET = SECRET; });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['31 bytes', 'x'.repeat(31)],
  ])('refuses to start with JWT_SECRET %s', async (_n, value) => {
    if (value === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = value;
    const f = Fastify();
    f.register((await import('../app')).app);
    await expect(f.ready()).rejects.toThrow(/JWT_SECRET/);
    await f.close().catch(() => undefined);
  });

  it('starts with a 32 byte secret and does not throw on a request without Origin', async () => {
    process.env.JWT_SECRET = 'x'.repeat(32);
    const f = Fastify();
    f.register((await import('../app')).app);
    await f.ready();
    const root = await f.inject({ method: 'GET', url: '/' });
    expect(root.statusCode).toBe(200);
    const me = await f.inject({ method: 'GET', url: '/api/v1/auth/me' });
    expect(me.statusCode).toBe(401);
    const local = await f.inject({ method: 'GET', url: '/', headers: { origin: 'http://localhost:36000' } });
    expect(local.statusCode).toBe(200);
    await f.close();
  });

  afterAll(async () => {
    // the grpc client is created when a route module loads; close its channel so jest exits cleanly
    const client = (await import('../grpc')).default;
    client.close();
  });
});

/* sessionUser and the Redis shutdown wiring: a throwaway redis:7 container, getUserById spied (no db-server). */
describe('auth hook user cache and shutdown', () => {
  const dockerEnv = (): NodeJS.ProcessEnv => {
    if (process.env.DOCKER_HOST) return process.env;
    try {
      execFileSync('docker', ['version', '--format', '{{.Server.Version}}'], { stdio: 'pipe' });
      return process.env;
    } catch {
      return { ...process.env, DOCKER_HOST: 'unix:///Users/xavier/.orbstack/run/docker.sock' };
    }
  };
  const env = dockerEnv();
  const docker = (args: string[]) => execFileSync('docker', args, { env, encoding: 'utf8', stdio: 'pipe' }).trim();
  const cname = `st6-hook-redis-${randomBytes(4).toString('hex')}`;
  const savedRedis = process.env.REDIS_URL;
  const uid = 'user-' + randomBytes(4).toString('hex');
  const dbUser = { user_id: uid, username: 'alice', password_hash: 'not-a-real-hash' };
  const token = () => jwt.sign({}, SECRET, { algorithm: 'HS256', subject: uid, expiresIn: 60 });

  async function cacheApp(): Promise<FastifyInstance> {
    process.env.JWT_SECRET = SECRET;
    const f = Fastify();
    await f.register(cookiePlugin);
    await f.register(jwtAuthPlugin);
    f.get('/api/v1/whoami', async (req) => ({ sessionUser: req.sessionUser ?? null }));
    await f.ready();
    return f;
  }

  beforeAll(async () => {
    docker(['run', '-d', '--name', cname, '-p', '127.0.0.1::6379', 'redis:7']);
    const port = docker(['port', cname, '6379/tcp']).split('\n')[0].split(':').pop();
    process.env.REDIS_URL = `redis://127.0.0.1:${port}`;
    for (let i = 0; i < 30; i++) {
      if (await cache.isCacheReady()) break;
      await new Promise((r) => setTimeout(r, 300));
    }
  });
  afterAll(async () => {
    await cache.closeClient();
    if (savedRedis === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = savedRedis;
    try { docker(['rm', '-f', cname]); } catch { /* already gone */ }
  });

  it('sets request.sessionUser from the RPC on a MISS and from the cache on a HIT (no second getUserById)', async () => {
    const f = await cacheApp();
    const spy = jest.spyOn(services, 'getUserById').mockResolvedValue(dbUser as never);
    try {
      const miss = await withCookie(f, token(), '/api/v1/whoami');
      expect(miss.json()).toEqual({ sessionUser: { user_id: uid, username: 'alice' } });
      expect(spy).toHaveBeenCalledTimes(1);
      const hit = await withCookie(f, token(), '/api/v1/whoami');
      expect(hit.json()).toEqual({ sessionUser: { user_id: uid, username: 'alice' } });
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
      await f.close();
    }
  });

  it('serves the request without calling getUserById when Redis is unreachable', async () => {
    const f = await cacheApp();
    const spy = jest.spyOn(services, 'getUserById').mockResolvedValue(dbUser as never);
    const saved = process.env.REDIS_URL;
    try {
      await cache.closeClient();
      process.env.REDIS_URL = 'redis://127.0.0.1:1';
      for (let i = 0; i < 2; i++) {
        const res = await withCookie(f, token(), '/api/v1/whoami');
        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ sessionUser: null });
      }
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
      process.env.REDIS_URL = saved;
      await f.close();
    }
  });

  it('closes the Redis client when the Fastify instance closes, and a second close is harmless', async () => {
    const f = await cacheApp();
    const client = (await import('../cache/redis-cache')).getClient();
    expect(client).not.toBeNull();
    await f.close();
    for (let i = 0; i < 20 && client?.status !== 'end'; i++) await new Promise((r) => setTimeout(r, 50));
    expect(client?.status).toBe('end');
    await expect(cache.closeClient()).resolves.toBeUndefined();
    await expect(cache.closeClient()).resolves.toBeUndefined();
  });
});
