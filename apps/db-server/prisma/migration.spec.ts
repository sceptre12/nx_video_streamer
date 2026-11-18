import { execFileSync } from 'child_process';
import { randomBytes } from 'crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
} from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

jest.setTimeout(180000);

const DOCKER_HOST = 'unix:///Users/xavier/.orbstack/run/docker.sock';
const PRISMA_DIR = __dirname;
const MIGRATIONS = join(PRISMA_DIR, 'migrations');
const LEGACY = ['20240624035006_init', '20240629030819_changed_dates_to_big_int'];
const REPO_ROOT = resolve(PRISMA_DIR, '..', '..', '..');

const suffix = randomBytes(4).toString('hex');
const container = `run-1-20261117-st1-u1-pg-${suffix}`;
const dbPassword = randomBytes(12).toString('hex');
let tmp: string;
let url: string;

function docker(args: string[]): string {
  return execFileSync('docker', args, {
    env: { ...process.env, DOCKER_HOST },
    encoding: 'utf8',
  }).trim();
}

function psql(sql: string): string {
  return docker([
    'exec', container, 'psql', '-U', 'postgres', '-d', 'postgres',
    '-At', '-v', 'ON_ERROR_STOP=1', '-c', sql,
  ]);
}

function deploy(): void {
  execFileSync(
    'npx',
    ['prisma', 'migrate', 'deploy', '--schema', join(tmp, 'schema.prisma')],
    {
      cwd: REPO_ROOT,
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
      encoding: 'utf8',
      stdio: 'pipe',
    }
  );
}

async function waitReady(): Promise<void> {
  for (let i = 0; i < 60; i++) {
    try {
      docker(['exec', container, 'pg_isready', '-U', 'postgres']);
      psql('select 1');
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error('postgres did not become ready');
}

describe('prisma migrations over legacy Video rows', () => {
  beforeAll(async () => {
    tmp = mkdtempSync(join(tmpdir(), 'u1-migration-'));
    docker([
      'run', '-d', '--name', container,
      '-e', `POSTGRES_PASSWORD=${dbPassword}`,
      '-p', '127.0.0.1::5432', 'postgres:16',
    ]);
    const mapping = docker(['port', container, '5432/tcp']);
    const port = mapping.split('\n')[0].split(':').pop();
    url = `postgresql://postgres:${dbPassword}@127.0.0.1:${port}/postgres`;
    await waitReady();
  });

  afterAll(() => {
    try {
      docker(['rm', '-f', container]);
    } catch {
      /* container already gone */
    }
    // temp dir lives under os tmpdir; left for the OS to clean (no rm in profile)
  });

  it('applies the new migration over legacy rows, which survive with owner_id NULL', () => {
    const all = readdirSync(MIGRATIONS).filter((d) =>
      existsSync(join(MIGRATIONS, d, 'migration.sql'))
    );
    const added = all.filter((d) => !LEGACY.includes(d));
    expect(added).toHaveLength(1);

    cpSync(join(PRISMA_DIR, 'schema.prisma'), join(tmp, 'schema.prisma'));
    mkdirSync(join(tmp, 'migrations'));
    cpSync(
      join(MIGRATIONS, 'migration_lock.toml'),
      join(tmp, 'migrations', 'migration_lock.toml')
    );
    for (const d of LEGACY) {
      cpSync(join(MIGRATIONS, d), join(tmp, 'migrations', d), { recursive: true });
    }
    deploy();

    psql(
      `insert into "Video" (video_id, start_time, end_time, is_streaming, video_path) values ` +
        `('legacy-1', 1, 2, false, 'a.mp4'), ('legacy-2', 3, null, true, 'b.mp4')`
    );

    cpSync(join(MIGRATIONS, added[0]), join(tmp, 'migrations', added[0]), {
      recursive: true,
    });
    deploy();

    expect(psql(`select count(*) from "Video" where owner_id is null`)).toBe('2');
    expect(psql(`select count(*) from "Video" where title is null and duration_s is null`)).toBe('2');
    expect(psql(`select count(*) from "User"`)).toBe('0');
  });
});
