import { randomBytes } from 'crypto';
import Fastify, { FastifyInstance } from 'fastify';
import { Writable } from 'stream';
import * as jwt from 'jsonwebtoken';
import { startDbServer, startPostgres, DbServerChild, ThrowawayPostgres } from '../../../../grpc/test-support';

/*
 * Routes against the built db-server (npx nx build db-server first) over a throwaway postgres.
 * JWT_SECRET and passwords are generated here, never literals.
 */
jest.setTimeout(240000);

const SECRET = randomBytes(32).toString('hex');
const rand = (p: string) => `${p}_${randomBytes(4).toString('hex')}`;
const pw = () => randomBytes(12).toString('hex');
const VALID_PW = pw();
const savedEnv = { s: process.env.JWT_SECRET, a: process.env.DB_GRPC_ADDR, c: process.env.COOKIE_SECURE };

let pg: ThrowawayPostgres;
let child: DbServerChild;
let f: FastifyInstance;
let logs = '';
let services: typeof import('../../../../grpc/services');
let password: typeof import('../../../../auth/password');

const post = (url: string, payload?: object, headers: Record<string, string> = {}) =>
  f.inject({ method: 'POST', url, payload, headers });
const setCookieOf = (res: { headers: Record<string, unknown> }) => ([] as string[]).concat((res.headers['set-cookie'] as string[] | string) ?? []);
const sessionCookie = (res: { headers: Record<string, unknown> }) => setCookieOf(res).find((c) => c.startsWith('nvs_session='));
const tokenOf = (c: string) => c.split(';')[0].split('=')[1];

async function register(username = rand('user'), p = pw()) {
  const res = await post('/api/v1/auth/register', { username, password: p });
  expect(res.statusCode).toBe(201);
  return { username, password: p, user_id: res.json().user_id as string };
}

beforeAll(async () => {
  pg = await startPostgres('app-server-auth-spec');
  child = await startDbServer({ DATABASE_URL: pg.url, DIRECT_URL: pg.url });
  process.env.JWT_SECRET = SECRET;
  // the client reads DB_GRPC_ADDR when its module loads, so import after the child is up
  process.env.DB_GRPC_ADDR = child.grpcAddr;
  delete process.env.COOKIE_SECURE;
  const { app } = await import('../../../../app');
  services = await import('../../../../grpc/services');
  password = await import('../../../../auth/password');
  const stream = new Writable({ write(chunk, _e, cb) { logs += chunk.toString(); cb(); } });
  f = Fastify({ logger: { level: 'info', stream } });
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

afterEach(() => { delete process.env.COOKIE_SECURE; jest.restoreAllMocks(); });

describe('register', () => {
  it('answers 201 with user_id and username, no password and no cookie; stores a bcrypt hash', async () => {
    const username = rand('reg');
    const p = pw();
    const res = await post('/api/v1/auth/register', { username, password: p });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual({ version: 'v1', user_id: expect.any(String), username });
    expect(JSON.stringify(res.json())).not.toContain(p);
    expect(setCookieOf(res)).toEqual([]);
    const stored = await services.getUserByUsername({ requestObject: { username }, callBack: () => undefined, errorHandler: () => undefined });
    expect(stored?.password_hash).not.toBe(p);
    expect(stored?.password_hash).toMatch(/^\$2[aby]\$10\$/);
  });

  it.each([
    ['short password', { username: 'valid_name', password: 'short' }],
    ['long password', { username: 'valid_name', password: 'x'.repeat(129) }],
    ['uppercase username', { username: 'Bad_Name', password: VALID_PW }],
    ['short username', { username: 'ab', password: VALID_PW }],
    ['missing password', { username: 'valid_name' }],
    ['non-string password', { username: 'valid_name', password: 12345678 }],
    ['array password', { username: 'valid_name', password: [VALID_PW] }],
  ])('answers 400 invalid_input for %s', async (_n, body) => {
    const res = await post('/api/v1/auth/register', body);
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ version: 'v1', error: { code: 'invalid_input', message: expect.any(String) } });
  });

  it('answers 409 username_taken for a duplicate', async () => {
    const u = await register();
    const res = await post('/api/v1/auth/register', { username: u.username, password: pw() });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('username_taken');
  });
});

describe('login', () => {
  it('sets the signed httpOnly session cookie with the contract flags', async () => {
    const u = await register();
    const res = await post('/api/v1/auth/login', { username: u.username, password: u.password });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ version: 'v1', user_id: u.user_id, username: u.username });
    const c = sessionCookie(res) as string;
    expect(c).toBeDefined();
    expect(c).toMatch(/HttpOnly/i);
    expect(c).toMatch(/SameSite=Lax/i);
    expect(c).toMatch(/Path=\//);
    expect(c).not.toMatch(/Secure/i);
    const payload = jwt.verify(tokenOf(c), SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    expect(payload.sub).toBe(u.user_id);
    expect((payload.exp as number) - (payload.iat as number)).toBe(8 * 3600);
  });

  it('adds Secure only when COOKIE_SECURE=true', async () => {
    const u = await register();
    process.env.COOKIE_SECURE = 'true';
    const on = sessionCookie(await post('/api/v1/auth/login', { username: u.username, password: u.password }));
    expect(on).toMatch(/Secure/i);
    process.env.COOKIE_SECURE = 'false';
    const off = sessionCookie(await post('/api/v1/auth/login', { username: u.username, password: u.password }));
    expect(off).not.toMatch(/Secure/i);
  });

  it('answers 401 invalid_credentials and sets no cookie for a wrong password', async () => {
    const u = await register();
    const res = await post('/api/v1/auth/login', { username: u.username, password: pw() });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('invalid_credentials');
    expect(sessionCookie(res)).toBeUndefined();
  });

  it('answers 401 invalid_credentials, runs the dummy compare and sets no cookie when the user is unset', async () => {
    const spy = jest.spyOn(password, 'dummyCompare');
    const known = await register();
    const wrong = await post('/api/v1/auth/login', { username: known.username, password: pw() });
    expect(spy).not.toHaveBeenCalled();
    const res = await post('/api/v1/auth/login', { username: rand('nobody'), password: pw() });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('invalid_credentials');
    expect(res.json()).toEqual(wrong.json());
    expect(spy).toHaveBeenCalledTimes(1);
    expect(sessionCookie(res)).toBeUndefined();
  });

  it.each([
    ['a missing field', { username: 'someone' }],
    ['a non-string password', { username: 'someone', password: 12345678 }],
  ])('answers 400 invalid_input for %s', async (_n, body) => {
    const res = await post('/api/v1/auth/login', body);
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('invalid_input');
  });

  it('logs a failed login with the username and never the password', async () => {
    const username = rand('logged');
    const p = pw();
    await post('/api/v1/auth/login', { username, password: p });
    expect(logs).toContain(username);
    expect(logs).toContain('login failed');
    expect(logs).not.toContain(p);
  });
});

describe('logout and me', () => {
  it('logout answers 204 and clears the cookie, with no body and no Content-Type', async () => {
    const res = await post('/api/v1/auth/logout');
    expect(res.statusCode).toBe(204);
    const c = sessionCookie(res) as string;
    expect(c).toBeDefined();
    expect(c).toMatch(/^nvs_session=;/);
    expect(c).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(c).toMatch(/Path=\//);
    expect((await post('/api/v1/auth/logout', {})).statusCode).toBe(204);
  });

  it('me answers 200 with user id and username and Cache-Control private, no-store', async () => {
    const u = await register();
    const login = await post('/api/v1/auth/login', { username: u.username, password: u.password });
    const res = await f.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { cookie: `nvs_session=${tokenOf(sessionCookie(login) as string)}` } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ version: 'v1', user_id: u.user_id, username: u.username });
    expect(res.headers['cache-control']).toBe('private, no-store');
  });

  it('me answers 401 unauthenticated without a cookie', async () => {
    const res = await f.inject({ method: 'GET', url: '/api/v1/auth/me' });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('unauthenticated');
  });

  it('me answers 401 for a valid token whose user does not exist', async () => {
    const token = jwt.sign({}, SECRET, { algorithm: 'HS256', subject: '00000000-0000-0000-0000-000000000000', expiresIn: 60 });
    const res = await f.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { cookie: `nvs_session=${token}` } });
    expect(res.statusCode).toBe(401);
  });
});
