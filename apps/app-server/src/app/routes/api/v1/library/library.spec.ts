import { randomBytes } from 'crypto';
import Fastify, { FastifyInstance } from 'fastify';
import { Writable } from 'stream';
import { PrismaClient } from '@prisma/client';
import type { VideoRecord } from '../../../../grpc/casing';
import { toLibraryVideo } from './library_mapper';
import { startDbServer, startPostgres, DbServerChild, ThrowawayPostgres } from '../../../../grpc/test-support';

/*
 * GET /api/v1/library against the built db-server (npx nx build db-server first) over a throwaway postgres.
 * JWT_SECRET and passwords are generated here, never literals.
 */
jest.setTimeout(240000);

const SECRET = randomBytes(32).toString('hex');
const rand = (p: string) => `${p}_${randomBytes(4).toString('hex')}`;
const savedEnv = { s: process.env.JWT_SECRET, a: process.env.DB_GRPC_ADDR, c: process.env.COOKIE_SECURE };

let pg: ThrowawayPostgres;
let child: DbServerChild;
let f: FastifyInstance;
let prisma: PrismaClient;
let logs = '';

const post = (url: string, payload?: object, cookie?: string) =>
  f.inject({ method: 'POST', url, payload, headers: cookie ? { cookie } : {} });
const getLibrary = (cookie?: string) =>
  f.inject({ method: 'GET', url: '/api/v1/library', headers: cookie ? { cookie } : {} });

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

const createVideo = async (cookie: string) => {
  const video_id = rand('vid');
  const res = await post('/api/v1/video/create', { video_id, start_time: 1000 }, cookie);
  expect(res.statusCode).toBe(200);
  return video_id;
};

beforeAll(async () => {
  pg = await startPostgres('app-server-library-spec');
  child = await startDbServer({ DATABASE_URL: pg.url, DIRECT_URL: pg.url });
  process.env.JWT_SECRET = SECRET;
  // the client reads DB_GRPC_ADDR when its module loads, so import after the child is up
  process.env.DB_GRPC_ADDR = child.grpcAddr;
  delete process.env.COOKIE_SECURE;
  prisma = new PrismaClient({ datasources: { db: { url: pg.url } } });
  const { app } = await import('../../../../app');
  const stream = new Writable({ write(chunk, _e, cb) { logs += chunk.toString(); cb(); } });
  f = Fastify({ logger: { level: 'info', stream } });
  f.register(app);
  await f.ready();
});

afterAll(async () => {
  await f?.close();
  await prisma?.$disconnect();
  (await import('../../../../grpc')).default.close();
  await child?.stop();
  pg?.stop();
  for (const [k, v] of [['JWT_SECRET', savedEnv.s], ['DB_GRPC_ADDR', savedEnv.a], ['COOKIE_SECURE', savedEnv.c]] as const) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe('GET /api/v1/library', () => {
  it('lists only the caller videos when two users each own videos', async () => {
    const a = await login();
    const b = await login();
    const a1 = await createVideo(a.cookie);
    const a2 = await createVideo(a.cookie);
    const b1 = await createVideo(b.cookie);
    await prisma.video.update({ where: { video_id: a1 }, data: { title: 'first', duration_s: 42 } });

    const resA = await getLibrary(a.cookie);
    expect(resA.statusCode).toBe(200);
    const bodyA = resA.json();
    expect(bodyA.version).toBe('v1');
    expect(bodyA.videos.map((v: { video_id: string }) => v.video_id).sort()).toEqual([a1, a2].sort());
    const first = bodyA.videos.find((v: { video_id: string }) => v.video_id === a1);
    expect(first).toEqual({
      video_id: a1,
      title: 'first',
      duration_s: 42,
      thumbnail_url: null,
      stream_url: `/api/v1/videos/${a1}/stream`,
    });
    const second = bodyA.videos.find((v: { video_id: string }) => v.video_id === a2);
    expect(second.title).toBeNull();
    expect(second.duration_s).toBeNull();
    for (const v of bodyA.videos) expect(Object.keys(v).sort()).toEqual(['duration_s', 'stream_url', 'thumbnail_url', 'title', 'video_id']);

    const resB = await getLibrary(b.cookie);
    expect(resB.json().videos.map((v: { video_id: string }) => v.video_id)).toEqual([b1]);
  });

  it('ignores a request parameter naming another owner', async () => {
    const a = await login();
    const b = await login();
    await createVideo(a.cookie);
    const res = await f.inject({ method: 'GET', url: `/api/v1/library?owner_id=${a.user_id}`, headers: { cookie: b.cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.json().videos).toEqual([]);
  });

  it('answers 401 unauthenticated without a cookie', async () => {
    const res = await getLibrary();
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ version: 'v1', error: { code: 'unauthenticated', message: expect.any(String) } });
  });

  it('logs the user id and the video count', async () => {
    const u = await login();
    await createVideo(u.cookie);
    await createVideo(u.cookie);
    logs = '';
    const res = await getLibrary(u.cookie);
    expect(res.statusCode).toBe(200);
    const entry = logs.split('\n').filter(Boolean).map((l) => JSON.parse(l)).find((l) => l.msg === 'library listed');
    expect(entry).toBeDefined();
    expect(entry.user_id).toBe(u.user_id);
    expect(entry.video_count).toBe(2);
  });

  it('does not list a legacy owner_id NULL row', async () => {
    const u = await login();
    const mine = await createVideo(u.cookie);
    const legacy = rand('legacy');
    await prisma.video.create({ data: { video_id: legacy, start_time: BigInt(1), owner_id: null } });
    const res = await getLibrary(u.cookie);
    expect(res.json().videos.map((v: { video_id: string }) => v.video_id)).toEqual([mine]);
  });

  it('sets Cache-Control: private, no-store and no X-Cache', async () => {
    const u = await login();
    const res = await getLibrary(u.cookie);
    expect(res.headers['cache-control']).toBe('private, no-store');
    expect(res.headers['x-cache']).toBeUndefined();
  });

  describe('failure path', () => {
    const errorEntry = () =>
      logs.split('\n').filter(Boolean).map((l) => JSON.parse(l)).find((l) => l.msg === 'library lookup failed');
    const expectInternal = (res: { statusCode: number; json: () => unknown }) => {
      expect(res.statusCode).toBe(500);
      expect(res.json()).toEqual({ version: 'v1', error: { code: 'internal_error', message: 'internal error' } });
    };

    it('answers 500 internal_error and logs when the lookup reports an error', async () => {
      const u = await login();
      const mod = await import('../../../../grpc/services/ownerVideos');
      const spy = jest.spyOn(mod, 'listVideosByOwner').mockImplementation(async ({ errorHandler }) => {
        errorHandler({ error: new Error('lookup-boom'), code: 500 });
        return [];
      });
      try {
        logs = '';
        const res = await getLibrary(u.cookie);
        expect(spy).toHaveBeenCalledTimes(1);
        expectInternal(res);
        expect(res.headers['cache-control']).toBeUndefined();
        const entry = errorEntry();
        expect(entry).toBeDefined();
        expect(entry.err.message).toBe('lookup-boom');
      } finally {
        spy.mockRestore();
      }
    });

    it('answers 500 internal_error and logs when the lookup resolves with nothing', async () => {
      const u = await login();
      const mod = await import('../../../../grpc/services/ownerVideos');
      const spy = jest.spyOn(mod, 'listVideosByOwner').mockResolvedValue(null);
      try {
        logs = '';
        const res = await getLibrary(u.cookie);
        expect(spy).toHaveBeenCalledTimes(1);
        expectInternal(res);
        expect(errorEntry()).toBeDefined();
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe('toLibraryVideo', () => {
    it('maps a record without title and duration_s to nulls', () => {
      const out = toLibraryVideo({ video_id: 'v-1' } as VideoRecord);
      expect(out).toEqual({ video_id: 'v-1', title: null, duration_s: null, thumbnail_url: null, stream_url: '/api/v1/videos/v-1/stream' });
    });
  });
});
