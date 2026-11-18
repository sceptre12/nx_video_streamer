import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { randomBytes } from 'crypto';
import { existsSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import { startPostgres, ThrowawayPostgres, REPO_ROOT } from '../../utils/test-support/postgres';
import { startDbServer, DbServerChild } from '../../utils/test-support/child';

/*
 * Needs a reachable Docker daemon and a built db-server (`npx nx build db-server`).
 * Secrets are generated at spec start and passed in memory.
 */
jest.setTimeout(240000);

type Client = Record<string, (req: unknown, cb: (err: grpc.ServiceError | null, res: any) => void) => void>;

let pg: ThrowawayPostgres;
let server: DbServerChild;
let client: Client;
let storage: string;
let prisma: PrismaClient;

const call = (method: string, req: unknown) =>
  new Promise<{ err: grpc.ServiceError | null; res: any }>((resolve) =>
    client[method](req, (err, res) => resolve({ err, res }))
  );

const start = () => Math.floor(Date.now() / 1000);

beforeAll(async () => {
  pg = await startPostgres('db-server-users-videos-spec');
  storage = mkdtempSync(join(tmpdir(), 'users-videos-spec-'));
  server = await startDbServer({
    DATABASE_URL: pg.url,
    DIRECT_URL: pg.url,
    JWT_SECRET: randomBytes(24).toString('hex'),
    VIDEO_STORAGE_DIR: storage,
  });
  const def = protoLoader.loadSync(join(REPO_ROOT, 'protos/src/video/v1/video.proto'), {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
  });
  const pkg = grpc.loadPackageDefinition(def) as any;
  client = new pkg.src.video.v1.DbComService(
    `127.0.0.1:${server.grpcPort}`,
    grpc.credentials.createInsecure()
  ) as unknown as Client;
  prisma = new PrismaClient({ datasources: { db: { url: pg.url } } });
});

afterAll(async () => {
  try { (client as unknown as grpc.Client)?.close(); } catch { /* ignore */ }
  await prisma?.$disconnect();
  await server?.stop();
  pg?.stop();
  // storage temp dir under os.tmpdir() is intentionally not removed
});

describe('users and videos over the built db-server', () => {
  const hash = randomBytes(16).toString('hex');
  let alice: any;
  let bob: any;

  it('creates users, rejects a duplicate username, and reads them back', async () => {
    const a = await call('CreateUser', { username: 'alice', password_hash: hash });
    expect(a.err).toBeNull();
    alice = a.res.user;
    expect(alice.user_id).toBeTruthy();
    expect(alice.password_hash).toBe(hash);
    expect(alice.created_at).toMatch(/^\d+$/); // int64 as string

    const b = await call('CreateUser', { username: 'bob', password_hash: hash });
    bob = b.res.user;

    const dup = await call('CreateUser', { username: 'alice', password_hash: hash });
    expect(dup.err?.code).toBe(grpc.status.ALREADY_EXISTS);

    const byName = await call('GetUserByUsername', { username: 'alice' });
    expect(byName.res.user.user_id).toBe(alice.user_id);
    const byId = await call('GetUserById', { user_id: alice.user_id });
    expect(byId.res.user.username).toBe('alice');

    const none = await call('GetUserByUsername', { username: 'nobody' });
    expect(none.err).toBeNull();
    expect(none.res.user).toBeFalsy();
    const noneId = await call('GetUserById', { user_id: 'missing' });
    expect(noneId.res.user).toBeFalsy();
  });

  it('creates videos with relative paths and maps BigInt values', async () => {
    const t = start();
    const r = await call('CreateVideo', { video_id: 'vid_a-1', start_time: t, owner_id: alice.user_id });
    expect(r.err).toBeNull();
    expect(r.res.results.video_path).toBe('vid_a-1/vid_a-1.mp4');
    expect(r.res.results.thumbnail_path).toBe('vid_a-1/thumbnail_vid_a-1.webp');
    expect(r.res.results.video_path.startsWith('/')).toBe(false);
    expect(r.res.results.start_time).toBe(t);
    expect(r.res.results.owner_id).toBe(alice.user_id);
    expect(existsSync(join(storage, 'vid_a-1'))).toBe(true);
  });

  it('answers INVALID_ARGUMENT for a bad video_id and creates no directory', async () => {
    const r = await call('CreateVideo', { video_id: '../x', start_time: start(), owner_id: alice.user_id });
    expect(r.err?.code).toBe(grpc.status.INVALID_ARGUMENT);
    expect(existsSync(join(storage, '..', 'x'))).toBe(false);
    expect(existsSync(join(storage, 'x'))).toBe(false);
  });

  it('answers ALREADY_EXISTS for a duplicate video_id and keeps serving', async () => {
    const dup = await call('CreateVideo', { video_id: 'vid_a-1', start_time: start(), owner_id: alice.user_id });
    expect(dup.err?.code).toBe(grpc.status.ALREADY_EXISTS);
    const ok = await call('CreateVideo', { video_id: 'vid_a-2', start_time: start(), owner_id: alice.user_id });
    expect(ok.err).toBeNull();
    expect(server.proc.exitCode).toBeNull();
  });

  it('filters reads by owner and excludes ownerless legacy rows', async () => {
    await call('CreateVideo', { video_id: 'vid_b-1', start_time: start(), owner_id: bob.user_id });
    await prisma.video.create({
      data: { video_id: 'legacy-1', start_time: BigInt(5), is_streaming: false, video_path: 'legacy/a.mp4' },
    });

    const list = await call('ListVideosByOwner', { owner_id: alice.user_id });
    const ids = list.res.results.map((v: any) => v.video_id).sort();
    expect(ids).toEqual(['vid_a-1', 'vid_a-2']);

    const own = await call('GetVideoForOwner', { video_id: 'vid_a-1', owner_id: alice.user_id });
    expect(own.err).toBeNull();
    expect(own.res.video_id).toBe('vid_a-1');

    const other = await call('GetVideoForOwner', { video_id: 'vid_a-1', owner_id: bob.user_id });
    expect(other.err?.code).toBe(grpc.status.NOT_FOUND);
    const legacy = await call('GetVideoForOwner', { video_id: 'legacy-1', owner_id: alice.user_id });
    expect(legacy.err?.code).toBe(grpc.status.NOT_FOUND);
  });

  it('updates only where the owner matches', async () => {
    const bad = await call('UpdateVideoStreamingState', { video_id: 'vid_a-1', has_streaming_started: true, owner_id: bob.user_id });
    expect(bad.err?.code).toBe(grpc.status.NOT_FOUND);
    const row = await prisma.video.findUnique({ where: { video_id: 'vid_a-1' } });
    expect(row?.is_streaming).toBe(false);
    expect(row?.video_path?.startsWith('/')).toBe(false);

    const good = await call('UpdateVideoStreamingState', { video_id: 'vid_a-1', has_streaming_started: true, owner_id: alice.user_id });
    expect(good.err).toBeNull();
    expect(good.res.update_complete).toBe(true);
    expect((await prisma.video.findUnique({ where: { video_id: 'vid_a-1' } }))?.is_streaming).toBe(true);
  });
});
