import { execFileSync, spawnSync } from 'child_process';
import { randomBytes } from 'crypto';
import { existsSync, mkdtempSync, readFileSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require('bcryptjs');

/*
 * Needs a reachable Docker daemon (postgres:16 throwaway container) and
 * ffmpeg/ffprobe on PATH. Secrets are generated in memory at spec start.
 */
jest.setTimeout(240000);

const ORBSTACK_SOCKET = 'unix:///Users/xavier/.orbstack/run/docker.sock';
const PRISMA_DIR = __dirname;
const REPO_ROOT = resolve(PRISMA_DIR, '..', '..', '..');
const SEED = join(PRISMA_DIR, 'seed.js');

const suffix = randomBytes(4).toString('hex');
const container = `run-1-20261117-u12-seed-${suffix}`;
const dbPassword = randomBytes(12).toString('hex');
const pw1 = randomBytes(12).toString('hex');
const pw2 = randomBytes(12).toString('hex');
let storage: string;
let url: string;
let dockerEnv: NodeJS.ProcessEnv = process.env;

function docker(args: string[]): string {
  return execFileSync('docker', args, {
    env: dockerEnv,
    encoding: 'utf8',
    stdio: 'pipe',
  }).trim();
}

function selectDockerEnv(): void {
  if (!process.env.DOCKER_HOST) {
    try {
      docker(['version', '--format', '{{.Server.Version}}']);
      return;
    } catch {
      dockerEnv = { ...process.env, DOCKER_HOST: ORBSTACK_SOCKET };
    }
  }
  docker(['version', '--format', '{{.Server.Version}}']);
}

function psql(sql: string): string {
  return docker([
    'exec', container, 'psql', '-U', 'postgres', '-d', 'postgres',
    '-At', '-v', 'ON_ERROR_STOP=1', '-c', sql,
  ]);
}

function runSeed(p1: string = pw1, p2: string = pw2) {
  return spawnSync('node', [SEED], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      DATABASE_URL: url,
      DIRECT_URL: url,
      VIDEO_STORAGE_DIR: storage,
      DEMO_USER1_PASSWORD: p1,
      DEMO_USER2_PASSWORD: p2,
    },
  });
}

function mediaRows(): { video_path: string }[] {
  return psql(`select video_path from "Video" order by video_path`)
    .split('\n')
    .filter(Boolean)
    .map((video_path) => ({ video_path }));
}

describe('demo seed', () => {
  beforeAll(async () => {
    selectDockerEnv();
    storage = mkdtempSync(join(tmpdir(), 'u12-seed-videos-'));
    docker([
      'run', '-d', '--name', container,
      '-e', `POSTGRES_PASSWORD=${dbPassword}`,
      '-p', '127.0.0.1::5432', 'postgres:16',
    ]);
    const port = docker(['port', container, '5432/tcp']).split('\n')[0].split(':').pop();
    url = `postgresql://postgres:${dbPassword}@127.0.0.1:${port}/postgres`;
    for (let i = 0; i < 60; i++) {
      try {
        docker(['exec', container, 'pg_isready', '-U', 'postgres']);
        psql('select 1');
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    execFileSync('npx', ['prisma', 'migrate', 'deploy', '--schema', join(PRISMA_DIR, 'schema.prisma')], {
      cwd: REPO_ROOT,
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
      stdio: 'pipe',
    });
  });

  afterAll(() => {
    try {
      docker(['rm', '-f', container]);
    } catch {
      /* already gone */
    }
  });

  let first: ReturnType<typeof runSeed>;

  it('seeds two accounts and playable VP9 MP4s with plain node, printing no password', () => {
    first = runSeed();
    expect(first.status).toBe(0);
    const out = first.stdout + first.stderr;
    expect(out).toContain('demo1');
    expect(out).toContain('demo2');
    expect(out).not.toContain(pw1);
    expect(out).not.toContain(pw2);

    expect(psql(`select username from "User" order by username`)).toBe('demo1\ndemo2');
    const rows = mediaRows();
    expect(rows.length).toBeGreaterThanOrEqual(2);
    for (const { video_path } of rows) {
      expect(video_path.startsWith('/')).toBe(false);
      const abs = join(storage, video_path);
      expect(existsSync(abs)).toBe(true);
      expect(statSync(abs).size).toBeGreaterThan(0);
      expect(readFileSync(abs).subarray(4, 8).toString('latin1')).toBe('ftyp');
      const probe = execFileSync(
        'ffprobe',
        ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', abs],
        { encoding: 'utf8' }
      ).trim();
      expect(probe).toBe('vp9');
    }
    expect(
      psql(`select count(*) from "Video" where owner_id is not null and title is not null and duration_s is not null and thumbnail_path not like '/%'`)
    ).toBe(String(rows.length));
  });

  it('is idempotent and upserts the password hash from env', async () => {
    const usersBefore = psql(`select count(*) from "User"`);
    const videosBefore = psql(`select count(*) from "Video"`);
    const second = runSeed();
    expect(second.status).toBe(0);
    expect(psql(`select count(*) from "User"`)).toBe(usersBefore);
    expect(psql(`select count(*) from "Video"`)).toBe(videosBefore);

    const hash = psql(`select password_hash from "User" where username = 'demo1'`);
    expect(await bcrypt.compare(pw1, hash)).toBe(true);

    const changed = randomBytes(12).toString('hex');
    const third = runSeed(changed, pw2);
    expect(third.status).toBe(0);
    expect(third.stdout + third.stderr).not.toContain(changed);
    const hash2 = psql(`select password_hash from "User" where username = 'demo1'`);
    expect(await bcrypt.compare(changed, hash2)).toBe(true);
    expect(await bcrypt.compare(pw1, hash2)).toBe(false);
    expect(psql(`select count(*) from "Video"`)).toBe(videosBefore);
  });
});
