import { execFileSync } from 'child_process';
import { randomBytes } from 'crypto';
import Redis from 'ioredis';
import { closeClient, getLibrary, getUser, invalidateLibrary, setLibrary, setUser } from './index';

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

const env = dockerEnv();
const docker = (args: string[]) => execFileSync('docker', args, { env, encoding: 'utf8', stdio: 'pipe' }).trim();
const name = `st6-u10-redis-${randomBytes(4).toString('hex')}`;
let admin: Redis;

jest.setTimeout(60000);

beforeAll(async () => {
  docker(['run', '-d', '--name', name, '-p', '127.0.0.1::6379', 'redis:7']);
  const port = docker(['port', name, '6379/tcp']).split('\n')[0].split(':').pop();
  process.env.REDIS_URL = `redis://127.0.0.1:${port}`;
  admin = new Redis(process.env.REDIS_URL);
  for (let i = 0; i < 30; i++) {
    try {
      if ((await admin.ping()) === 'PONG') break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
});

afterAll(async () => {
  await closeClient();
  if (admin) admin.disconnect();
  try {
    docker(['rm', '-f', name]);
  } catch {
    /* already gone */
  }
});

describe('cache module', () => {
  it('round-trips the library value with a 60 s TTL under lib:v1:{user_id}', async () => {
    expect(await getLibrary('u1')).toBeNull();
    const body = { videos: [{ video_id: 'v1' }] };
    await setLibrary('u1', body);
    expect(await getLibrary('u1')).toEqual(body);
    const ttl = await admin.ttl('lib:v1:u1');
    expect(ttl).toBeGreaterThan(55);
    expect(ttl).toBeLessThanOrEqual(60);
  });

  it('round-trips the user value with a 300 s TTL and never stores password_hash', async () => {
    await setUser('u2', { user_id: 'u2', username: 'demo', password_hash: 'secret-hash' } as never);
    expect(await getUser('u2')).toEqual({ user_id: 'u2', username: 'demo' });
    const raw = (await admin.get('user:v1:u2')) as string;
    expect(raw).not.toContain('password_hash');
    expect(raw).not.toContain('secret-hash');
    const ttl = await admin.ttl('user:v1:u2');
    expect(ttl).toBeGreaterThan(295);
    expect(ttl).toBeLessThanOrEqual(300);
  });

  it('invalidateLibrary deletes lib:v1:{user_id} only', async () => {
    await setLibrary('a', { n: 1 });
    await setLibrary('b', { n: 2 });
    await setUser('a', { user_id: 'a', username: 'ua' });
    await invalidateLibrary('a');
    expect(await admin.exists('lib:v1:a')).toBe(0);
    expect(await admin.exists('lib:v1:b')).toBe(1);
    expect(await admin.exists('user:v1:a')).toBe(1);
  });

  it('fails open: with Redis stopped every read is a MISS and nothing throws', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    docker(['stop', '-t', '1', name]);
    await expect(getLibrary('u1')).resolves.toBeNull();
    await expect(getUser('u2')).resolves.toBeNull();
    await expect(setLibrary('u1', { x: 1 })).resolves.toBeUndefined();
    await expect(setUser('u2', { user_id: 'u2', username: 'demo' })).resolves.toBeUndefined();
    await expect(invalidateLibrary('u1')).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
