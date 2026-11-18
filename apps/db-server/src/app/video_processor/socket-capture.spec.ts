import { randomBytes } from 'crypto';
import { spawn } from 'child_process';
import { existsSync, mkdtempSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import jwt from 'jsonwebtoken';
import { io as connect, Socket } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';
import { startPostgres, ThrowawayPostgres, REPO_ROOT } from '../utils/test-support/postgres';
import { startDbServer, DbServerChild } from '../utils/test-support/child';

/*
 * Needs a reachable Docker daemon and a built db-server (`npx nx build db-server`).
 * JWT_SECRET is generated at spec start and passed in memory.
 */
jest.setTimeout(240000);

let pg: ThrowawayPostgres;
let server: DbServerChild;
let storage: string;
let prisma: PrismaClient;
const secret = randomBytes(24).toString('hex');
let aliceId: string;
let bobId: string;

const cookie = (token: string) => ({ cookie: `other=1; nvs_session=${token}` });
const sign = (sub: string, alg: 'HS256' | 'HS512' = 'HS256') =>
  jwt.sign({ sub }, secret, { algorithm: alg, expiresIn: '8h' });

const open = (headers: Record<string, string>) =>
  new Promise<{ socket: Socket; error?: Error }>((resolve) => {
    const socket = connect(`http://127.0.0.1:${server.port}`, {
      extraHeaders: headers, reconnection: false, forceNew: true,
    });
    socket.on('connect', () => resolve({ socket }));
    socket.on('connect_error', (error) => { socket.close(); resolve({ socket, error }); });
  });

const emitAck = (socket: Socket, ev: string, data: unknown) =>
  new Promise<any>((resolve) => socket.emit(ev, data, resolve));
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

beforeAll(async () => {
  pg = await startPostgres('db-server-socket-capture-spec');
  storage = mkdtempSync(join(tmpdir(), 'socket-capture-spec-'));
  prisma = new PrismaClient({ datasources: { db: { url: pg.url } } });
  const hash = randomBytes(16).toString('hex');
  aliceId = (await prisma.user.create({ data: { username: 'alice', password_hash: hash, created_at: BigInt(Date.now()) } })).user_id;
  bobId = (await prisma.user.create({ data: { username: 'bob', password_hash: hash, created_at: BigInt(Date.now()) } })).user_id;
  const base = { start_time: BigInt(Date.now()), is_streaming: false };
  await prisma.video.create({ data: { ...base, video_id: 'alice-1', owner_id: aliceId } });
  await prisma.video.create({ data: { ...base, video_id: 'alice-2', owner_id: aliceId } });
  await prisma.video.create({ data: { ...base, video_id: 'bob-1', owner_id: bobId } });
  await prisma.video.create({ data: { ...base, video_id: 'legacy-1' } });
  server = await startDbServer({
    DATABASE_URL: pg.url, DIRECT_URL: pg.url, JWT_SECRET: secret, VIDEO_STORAGE_DIR: storage,
  });
});

afterAll(async () => {
  await prisma?.$disconnect();
  await server?.stop();
  pg?.stop();
});

describe('socket.io webcam capture', () => {
  it('refuses a handshake without a valid cookie', async () => {
    const none = await open({});
    expect(none.error?.message).toBe('unauthenticated');
    const bad = await open(cookie('not-a-jwt'));
    expect(bad.error?.message).toBe('unauthenticated');
  });

  it('refuses tokens signed with alg none or HS512', async () => {
    const hs512 = await open(cookie(sign(aliceId, 'HS512')));
    expect(hs512.error?.message).toBe('unauthenticated');
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const none = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: aliceId })}.`;
    const r = await open(cookie(none));
    expect(r.error?.message).toBe('unauthenticated');
  });

  it('writes the owner capture and refuses traversal, foreign and legacy videos', async () => {
    const { socket } = await open(cookie(sign(aliceId)));
    expect(socket.connected).toBe(true);
    for (const video_id of ['../evil', 'a/b', '', 'bob-1', 'legacy-1', 'missing-1']) {
      const r = await emitAck(socket, 'initalizeStream', { video_id, video_path: '/tmp/evil.mp4' });
      expect(r.ok).toBe(false);
    }
    expect(existsSync(join(storage, '..', 'evil'))).toBe(false);

    // two sequential captures both write; the client video_path is ignored
    for (const [id, text] of [['alice-1', 'one'], ['alice-2', 'two']]) {
      expect((await emitAck(socket, 'initalizeStream', { video_id: id, video_path: '/tmp/evil.mp4' })).ok).toBe(true);
      socket.emit('webcamVideoChunk', { video_chunk: Buffer.from(text) });
      expect(await emitAck(socket, 'endWebcamStream', { video_id: id })).toBe(true);
      expect(readFileSync(join(storage, id, `${id}.mp4`), 'utf8')).toBe(text);
    }
    expect(existsSync('/tmp/evil.mp4')).toBe(false);
    socket.close();
  });

  it('a second authenticated socket cannot touch the first user\'s file', async () => {
    const a = (await open(cookie(sign(aliceId)))).socket;
    const b = (await open(cookie(sign(bobId)))).socket;
    expect((await emitAck(a, 'initalizeStream', { video_id: 'alice-1' })).ok).toBe(true);
    a.emit('webcamVideoChunk', { video_chunk: Buffer.from('mine') });
    // bob has no stream: chunk and end do nothing to alice's file, and he cannot init it
    b.emit('webcamVideoChunk', { video_chunk: Buffer.from('theft') });
    await emitAck(b, 'endWebcamStream', { video_id: 'alice-1' });
    expect((await emitAck(b, 'initalizeStream', { video_id: 'alice-1' })).ok).toBe(false);
    a.emit('webcamVideoChunk', { video_chunk: Buffer.from('+more') });
    expect(await emitAck(a, 'endWebcamStream', { video_id: 'alice-1' })).toBe(true);
    expect(readFileSync(join(storage, 'alice-1', 'alice-1.mp4'), 'utf8')).toBe('mine+more');
    a.close();
    b.close();
    await pause(100);
  });
});

describe('startup', () => {
  it('db-server refuses to start without JWT_SECRET', async () => {
    const env = { ...process.env, PORT: '0', GRPC_PORT: '0', VIDEO_STORAGE_DIR: storage } as NodeJS.ProcessEnv;
    delete env.JWT_SECRET;
    const code = await new Promise<number | null>((resolve) => {
      const p = spawn('node', ['dist/apps/db-server/main.js'], { cwd: REPO_ROOT, env });
      const t = setTimeout(() => p.kill('SIGKILL'), 20000);
      p.on('exit', (c) => { clearTimeout(t); resolve(c); });
    });
    expect(code).toBe(1);
  });
});
