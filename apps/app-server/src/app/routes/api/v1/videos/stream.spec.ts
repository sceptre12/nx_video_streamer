import { randomBytes } from 'crypto';
import { mkdirSync, mkdtempSync, realpathSync, statSync, symlinkSync, utimesSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import Fastify, { FastifyInstance } from 'fastify';
import { Writable } from 'stream';
import { PrismaClient } from '@prisma/client';
import { startDbServer, startPostgres, DbServerChild, ThrowawayPostgres } from '../../../../grpc/test-support';
import { parseRange } from './range';
import { resolveVideoFile, videoStorageDir } from './storage';

/*
 * GET /api/v1/videos/{video_id}/stream against the built db-server (npx nx build db-server first) over a
 * throwaway postgres. The file bytes live in a per-spec VIDEO_STORAGE_DIR. JWT_SECRET and passwords are
 * generated here, never literals.
 */
jest.setTimeout(240000);

const SECRET = randomBytes(32).toString('hex');
const rand = (p: string) => `${p}_${randomBytes(4).toString('hex')}`;
const savedEnv = {
  s: process.env.JWT_SECRET,
  a: process.env.DB_GRPC_ADDR,
  c: process.env.COOKIE_SECURE,
  v: process.env.VIDEO_STORAGE_DIR,
};

const ROOT = mkdtempSync(join(tmpdir(), 'app-server-stream-spec-'));
const STORAGE = join(ROOT, 'videos');
const OUTSIDE = join(ROOT, 'outside');
mkdirSync(STORAGE);
mkdirSync(OUTSIDE);
const OUTSIDE_BYTES = Buffer.from('outside-the-volume-' + randomBytes(8).toString('hex'));
writeFileSync(join(OUTSIDE, 'secret.mp4'), OUTSIDE_BYTES);

let pg: ThrowawayPostgres;
let child: DbServerChild;
let f: FastifyInstance;
let prisma: PrismaClient;
let logs = '';

const post = (url: string, payload?: object) => f.inject({ method: 'POST', url, payload });
const getStream = (video_id: string, headers: Record<string, string> = {}) =>
  f.inject({ method: 'GET', url: `/api/v1/videos/${video_id}/stream`, headers });

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

/** Inserts a Video row (owner, stored path) and, unless the path is given, writes `bytes` under the volume. */
async function seedVideo(owner_id: string | null, bytes: Buffer, video_path?: string) {
  const video_id = rand('vid');
  const stored = video_path ?? `${video_id}/${video_id}.mp4`;
  if (!video_path) {
    mkdirSync(join(STORAGE, video_id));
    writeFileSync(join(STORAGE, stored), bytes);
  }
  await prisma.video.create({ data: { video_id, start_time: BigInt(1), owner_id, video_path: stored, is_streaming: false } });
  return video_id;
}

const BYTES = randomBytes(1000);
const expectNotFound = (res: { statusCode: number; json: () => unknown }) => {
  expect(res.statusCode).toBe(404);
  expect(res.json()).toEqual({ version: 'v1', error: { code: 'not_found', message: expect.any(String) } });
};
const expectUnsatisfiable = (res: { statusCode: number; json: () => unknown }) => {
  expect(res.statusCode).toBe(416);
  expect(res.json()).toEqual({ version: 'v1', error: { code: 'range_not_satisfiable', message: expect.any(String) } });
};
const expectStreamHeaders = (headers: Record<string, unknown>) => {
  expect(headers['accept-ranges']).toBe('bytes');
  expect(headers['content-type']).toBe('video/mp4');
  expect(headers['etag']).toEqual(expect.stringMatching(/^"[0-9a-f]+-[0-9a-f]+"$/));
  expect(headers['cache-control']).toBe('private, max-age=300');
  expect(headers['vary']).toBe('Cookie');
};

beforeAll(async () => {
  pg = await startPostgres('app-server-stream-spec');
  child = await startDbServer({ DATABASE_URL: pg.url, DIRECT_URL: pg.url, VIDEO_STORAGE_DIR: STORAGE });
  process.env.JWT_SECRET = SECRET;
  // the client reads DB_GRPC_ADDR when its module loads, so import after the child is up
  process.env.DB_GRPC_ADDR = child.grpcAddr;
  process.env.VIDEO_STORAGE_DIR = STORAGE;
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
  for (const [k, v] of [
    ['JWT_SECRET', savedEnv.s],
    ['DB_GRPC_ADDR', savedEnv.a],
    ['COOKIE_SECURE', savedEnv.c],
    ['VIDEO_STORAGE_DIR', savedEnv.v],
  ] as const) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe('GET /api/v1/videos/{video_id}/stream', () => {
  let owner: { user_id: string; cookie: string };
  let videoId: string;

  beforeAll(async () => {
    owner = await login();
    videoId = await seedVideo(owner.user_id, BYTES);
  });

  it('answers 200 with the full body and the stream headers', async () => {
    const res = await getStream(videoId, { cookie: owner.cookie });
    expect(res.statusCode).toBe(200);
    expect(res.rawPayload.equals(BYTES)).toBe(true);
    expect(res.headers['content-length']).toBe(String(BYTES.length));
    expect(res.headers['content-range']).toBeUndefined();
    expectStreamHeaders(res.headers);
  });

  it('answers 206 with the slice and a matching Content-Range for bytes=a-b', async () => {
    const res = await getStream(videoId, { cookie: owner.cookie, range: 'bytes=100-199' });
    expect(res.statusCode).toBe(206);
    expect(res.rawPayload.equals(BYTES.subarray(100, 200))).toBe(true);
    expect(res.headers['content-range']).toBe(`bytes 100-199/${BYTES.length}`);
    expect(res.headers['content-length']).toBe('100');
    expectStreamHeaders(res.headers);
  });

  it('answers 206 from a to the end for bytes=a-', async () => {
    const res = await getStream(videoId, { cookie: owner.cookie, range: 'bytes=900-' });
    expect(res.statusCode).toBe(206);
    expect(res.rawPayload.equals(BYTES.subarray(900))).toBe(true);
    expect(res.headers['content-range']).toBe(`bytes 900-999/${BYTES.length}`);
    expectStreamHeaders(res.headers);
  });

  it('answers 206 with the last n bytes for bytes=-n', async () => {
    const res = await getStream(videoId, { cookie: owner.cookie, range: 'bytes=-50' });
    expect(res.statusCode).toBe(206);
    expect(res.rawPayload.equals(BYTES.subarray(950))).toBe(true);
    expect(res.headers['content-range']).toBe(`bytes 950-999/${BYTES.length}`);
    expectStreamHeaders(res.headers);
  });

  it('answers 206 with the single first byte for bytes=0-0', async () => {
    const res = await getStream(videoId, { cookie: owner.cookie, range: 'bytes=0-0' });
    expect(res.statusCode).toBe(206);
    expect(res.rawPayload.equals(BYTES.subarray(0, 1))).toBe(true);
    expect(res.headers['content-range']).toBe(`bytes 0-0/${BYTES.length}`);
  });

  it('answers 416 for an unsatisfiable range', async () => {
    const res = await getStream(videoId, { cookie: owner.cookie, range: `bytes=${BYTES.length}-` });
    expectUnsatisfiable(res);
    expect(res.headers['content-range']).toBe(`bytes */${BYTES.length}`);
  });

  it.each(['bytes=0-1,3-4', 'bytes=abc', 'items=0-1', 'bytes=5-2', 'bytes=-', 'bytes=-0'])(
    'answers 416 range_not_satisfiable for a multi-range or malformed Range %p',
    async (range) => {
      expectUnsatisfiable(await getStream(videoId, { cookie: owner.cookie, range }));
    }
  );

  it('answers 401 unauthenticated without a cookie', async () => {
    const res = await getStream(videoId);
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ version: 'v1', error: { code: 'unauthenticated', message: expect.any(String) } });
  });

  it('answers 401 (not 404) without a cookie for a video that does not exist', async () => {
    const res = await getStream(rand('missing'));
    expect(res.statusCode).toBe(401);
  });

  it('answers 404 not_found for another user video', async () => {
    const other = await login();
    expectNotFound(await getStream(videoId, { cookie: other.cookie }));
  });

  it('answers 404 not_found for a legacy owner_id NULL row', async () => {
    const legacy = await seedVideo(null, BYTES);
    expectNotFound(await getStream(legacy, { cookie: owner.cookie }));
  });

  it('answers 404 not_found for a missing video', async () => {
    expectNotFound(await getStream(rand('missing'), { cookie: owner.cookie }));
  });

  it('answers 404 not_found when the stored file is absent', async () => {
    const id = await seedVideo(owner.user_id, BYTES, `${rand('nofile')}/x.mp4`);
    expectNotFound(await getStream(id, { cookie: owner.cookie }));
  });

  describe('path traversal', () => {
    // the real fs module object (the one stream.ts reads through), not an interop copy
    const nodeFs: typeof import('fs') = jest.requireActual('fs');
    let readSpy: jest.SpyInstance;
    beforeEach(() => {
      readSpy = jest.spyOn(nodeFs, 'createReadStream');
    });
    afterEach(() => readSpy.mockRestore());

    const expectNothingRead = (res: { statusCode: number; rawPayload: Buffer; json: () => unknown }) => {
      expectNotFound(res);
      expect(res.rawPayload.includes(OUTSIDE_BYTES)).toBe(false);
      expect(readSpy).not.toHaveBeenCalled();
    };

    it('control: the read spy sees the read of an in-volume file', async () => {
      const res = await getStream(videoId, { cookie: owner.cookie });
      expect(res.statusCode).toBe(200);
      expect(readSpy).toHaveBeenCalledTimes(1);
    });

    it('answers 404 for a relative path that escapes the volume and reads no file', async () => {
      const id = await seedVideo(owner.user_id, BYTES, '../outside/secret.mp4');
      expectNothingRead(await getStream(id, { cookie: owner.cookie }));
    });

    it('answers 404 for an absolute stored path and reads no file', async () => {
      const id = await seedVideo(owner.user_id, BYTES, join(OUTSIDE, 'secret.mp4'));
      expectNothingRead(await getStream(id, { cookie: owner.cookie }));
    });

    it('answers 404 for a symlink inside the volume pointing outside it and reads no file', async () => {
      const link = `${rand('link')}.mp4`;
      symlinkSync(join(OUTSIDE, 'secret.mp4'), join(STORAGE, link));
      const id = await seedVideo(owner.user_id, BYTES, link);
      expectNothingRead(await getStream(id, { cookie: owner.cookie }));
    });
  });

  it('logs the stream request with user id, video id, status and range', async () => {
    logs = '';
    const res = await getStream(videoId, { cookie: owner.cookie, range: 'bytes=0-9' });
    expect(res.statusCode).toBe(206);
    const entry = logs.split('\n').filter(Boolean).map((l) => JSON.parse(l)).find((l) => l.msg === 'video stream');
    expect(entry).toBeDefined();
    expect(entry.user_id).toBe(owner.user_id);
    expect(entry.video_id).toBe(videoId);
    expect(entry.status).toBe(206);
    expect(entry.range).toBe('bytes=0-9');
  });

  describe('failure path', () => {
    it('answers 500 internal_error when the lookup fails with a non-NOT_FOUND error', async () => {
      const mod = await import('../../../../grpc/services/ownerVideos');
      const spy = jest.spyOn(mod, 'getVideoForOwner').mockImplementation(async ({ errorHandler }) => {
        errorHandler({ error: new Error('lookup-boom'), code: 500 });
        return null;
      });
      try {
        const res = await getStream(videoId, { cookie: owner.cookie });
        expect(spy).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(500);
        expect(res.json()).toEqual({ version: 'v1', error: { code: 'internal_error', message: 'internal error' } });
      } finally {
        spy.mockRestore();
      }
    });
  });
});

describe('parseRange', () => {
  it('clamps an end past the file to the last byte', () => {
    expect(parseRange('bytes=5-999', 10)).toEqual({ kind: 'partial', range: { start: 5, end: 9 } });
  });
  it('serves the whole file for a suffix longer than the file', () => {
    expect(parseRange('bytes=-50', 10)).toEqual({ kind: 'partial', range: { start: 0, end: 9 } });
  });
  it('treats any range on an empty file as unsatisfiable', () => {
    expect(parseRange('bytes=0-', 0)).toEqual({ kind: 'unsatisfiable' });
    expect(parseRange('bytes=-1', 0)).toEqual({ kind: 'unsatisfiable' });
  });
  it('is full without a header', () => {
    expect(parseRange(undefined, 10)).toEqual({ kind: 'full' });
  });
});

describe('parseRange edge cases', () => {
  it('trims surrounding whitespace in the header', () => {
    expect(parseRange(' bytes=0-9 ', 20)).toEqual({ kind: 'partial', range: { start: 0, end: 9 } });
  });
  it('rejects text before bytes= (anchored at the start)', () => {
    expect(parseRange('xbytes=0-9', 20)).toEqual({ kind: 'unsatisfiable' });
  });
  it('rejects text after the range (anchored at the end)', () => {
    expect(parseRange('bytes=0-9x', 20)).toEqual({ kind: 'unsatisfiable' });
  });
  it('rejects bytes= with both numbers empty', () => {
    expect(parseRange('bytes=-', 20)).toEqual({ kind: 'unsatisfiable' });
  });
  it('rejects a suffix length beyond the safe-integer range', () => {
    expect(parseRange('bytes=-99999999999999999999', 20)).toEqual({ kind: 'unsatisfiable' });
  });
  it('rejects a start beyond the safe-integer range', () => {
    expect(parseRange('bytes=99999999999999999999-', 20)).toEqual({ kind: 'unsatisfiable' });
  });
  it('rejects an end beyond the safe-integer range', () => {
    expect(parseRange('bytes=0-99999999999999999999', 20)).toEqual({ kind: 'unsatisfiable' });
  });
});

describe('resolveVideoFile', () => {
  const root = mkdtempSync(join(tmpdir(), 'app-server-stream-storage-'));
  mkdirSync(join(root, 'dir'));
  mkdirSync(join(root, '..x'));
  writeFileSync(join(root, '..x', 'a.mp4'), 'abc');
  writeFileSync(join(root, 'real.mp4'), 'abc');
  symlinkSync(join(root, 'real.mp4'), join(root, 'link.mp4'));

  it('defaults the storage directory to /data/videos when VIDEO_STORAGE_DIR is unset', () => {
    const saved = process.env.VIDEO_STORAGE_DIR;
    delete process.env.VIDEO_STORAGE_DIR;
    try {
      expect(videoStorageDir()).toBe('/data/videos');
    } finally {
      if (saved === undefined) delete process.env.VIDEO_STORAGE_DIR;
      else process.env.VIDEO_STORAGE_DIR = saved;
    }
  });
  it('accepts a directory whose name merely starts with two dots', async () => {
    const file = await resolveVideoFile('..x/a.mp4', root);
    expect(file?.path).toBe(realpathSync(join(root, '..x', 'a.mp4')));
  });
  it('is null for a missing, null, undefined or empty path', async () => {
    expect(await resolveVideoFile(null, root)).toBeNull();
    expect(await resolveVideoFile(undefined, root)).toBeNull();
    expect(await resolveVideoFile('', root)).toBeNull();
  });
  it('is null for an absolute path even when it points inside the volume', async () => {
    expect(await resolveVideoFile(join(root, 'real.mp4'), root)).toBeNull();
  });
  it('is null for a path that is the volume root or a parent of it', async () => {
    expect(await resolveVideoFile('.', root)).toBeNull();
    expect(await resolveVideoFile('..', root)).toBeNull();
    expect(await resolveVideoFile('../', root)).toBeNull();
  });
  it('is null for a directory', async () => {
    expect(await resolveVideoFile('dir', root)).toBeNull();
  });
  it('returns the real path of a symlink that stays inside the volume', async () => {
    const file = await resolveVideoFile('link.mp4', root);
    expect(file?.path).toBe(realpathSync(join(root, 'real.mp4')));
  });
});

describe('stream route: ETag, lookup failures and log status', () => {
  let owner: { user_id: string; cookie: string };
  let videoId: string;
  const logEntry = (msg: string) => logs.split('\n').filter(Boolean).map((l) => JSON.parse(l)).find((l) => l.msg === msg);

  beforeAll(async () => {
    owner = await login();
    videoId = await seedVideo(owner.user_id, BYTES);
  });

  it('builds the ETag from the hex size and the hex mtime in whole milliseconds', async () => {
    const path = join(STORAGE, videoId, `${videoId}.mp4`);
    utimesSync(path, 1700000000, 1700000000);
    const res = await getStream(videoId, { cookie: owner.cookie });
    const st = statSync(path);
    expect(res.headers['etag']).toBe(`"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`);
    expect(res.headers['etag']).toBe(`"3e8-${(1700000000000).toString(16)}"`);
  });
  it('changes the ETag when the file mtime changes', async () => {
    const path = join(STORAGE, videoId, `${videoId}.mp4`);
    utimesSync(path, 1700000000, 1700000000);
    const a = (await getStream(videoId, { cookie: owner.cookie })).headers['etag'];
    utimesSync(path, 1700000100, 1700000100);
    const b = (await getStream(videoId, { cookie: owner.cookie })).headers['etag'];
    expect(a).not.toBe(b);
  });

  it('logs status 200 and a null range for a full read', async () => {
    logs = '';
    await getStream(videoId, { cookie: owner.cookie });
    const e = logEntry('video stream');
    expect(e.status).toBe(200);
    expect(e.range).toBeNull();
  });
  it('logs status 416 for an unsatisfiable range', async () => {
    logs = '';
    await getStream(videoId, { cookie: owner.cookie, range: 'bytes=5000-' });
    const e = logEntry('video stream');
    expect(e.status).toBe(416);
    expect(e.range).toBe('bytes=5000-');
  });
  it('logs status 404 when the stored file is absent', async () => {
    const id = await seedVideo(owner.user_id, BYTES, `${rand('nofile')}/x.mp4`);
    logs = '';
    await getStream(id, { cookie: owner.cookie });
    expect(logEntry('video stream').status).toBe(404);
  });

  describe('lookup failures', () => {
    const withLookup = async (impl: (a: { errorHandler: (e: { error: Error; code: number }) => void }) => Promise<unknown>) => {
      const mod = await import('../../../../grpc/services/ownerVideos');
      const spy = jest.spyOn(mod, 'getVideoForOwner').mockImplementation(impl as never);
      try {
        logs = '';
        return await getStream(videoId, { cookie: owner.cookie });
      } finally {
        spy.mockRestore();
      }
    };

    it('answers 500 and logs the failure when the lookup returns nothing and reports no error', async () => {
      const res = await withLookup(async () => null);
      expect(res.statusCode).toBe(500);
      expect(res.json()).toEqual({ version: 'v1', error: { code: 'internal_error', message: 'internal error' } });
      expect(logEntry('video stream').status).toBe(500);
    });
    it('answers 500 when an error is reported even though a video came back', async () => {
      const res = await withLookup(async ({ errorHandler }) => {
        errorHandler({ error: new Error('lookup-boom'), code: 500 });
        return { video_id: videoId, video_path: `${videoId}/${videoId}.mp4` };
      });
      expect(res.statusCode).toBe(500);
      expect(res.rawPayload.includes(BYTES)).toBe(false);
      expect(logEntry('video stream lookup failed')).toBeDefined();
      expect(logEntry('video stream').status).toBe(500);
    });
  });
});
