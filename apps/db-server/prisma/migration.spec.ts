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

/*
 * Needs a reachable Docker daemon and pulls postgres:16 on first run.
 * DOCKER_HOST is taken from the caller's environment when set; otherwise the
 * default docker context is used. Only when that is unreachable is the
 * OrbStack socket below tried, as a DEFAULT that never overrides a caller value.
 * With no reachable daemon the suite fails loudly in beforeAll (no silent pass).
 */
jest.setTimeout(180000);

const ORBSTACK_SOCKET = 'unix:///Users/xavier/.orbstack/run/docker.sock';
const PRISMA_DIR = __dirname;
const MIGRATIONS = join(PRISMA_DIR, 'migrations');
// The two migrations that predate this change: applied first so legacy Video
// rows exist before the new migration runs. Pinned by name on purpose.
const LEGACY = ['20240624035006_init', '20240629030819_changed_dates_to_big_int'];
const NEW_MIGRATION = '20261117120000_add_users_and_video_owner';
const REPO_ROOT = resolve(PRISMA_DIR, '..', '..', '..');

const suffix = randomBytes(4).toString('hex');
const container = `db-server-migration-spec-${suffix}`;
const dbPassword = randomBytes(12).toString('hex');
let tmp: string;
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
  if (process.env.DOCKER_HOST) {
    dockerEnv = process.env;
  } else {
    try {
      docker(['version', '--format', '{{.Server.Version}}']);
      return;
    } catch {
      dockerEnv = { ...process.env, DOCKER_HOST: ORBSTACK_SOCKET };
    }
  }
  try {
    docker(['version', '--format', '{{.Server.Version}}']);
  } catch (e) {
    throw new Error(
      'migration.spec needs a reachable Docker daemon (set DOCKER_HOST or start Docker/OrbStack): ' +
        String(e)
    );
  }
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
    selectDockerEnv();
    tmp = mkdtempSync(join(tmpdir(), 'db-server-migration-spec-'));
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
    // the temp dir under os.tmpdir() is intentionally not removed
  });

  it('applies the new migration over legacy rows, which survive with owner_id NULL', () => {
    const all = readdirSync(MIGRATIONS).filter((d) =>
      existsSync(join(MIGRATIONS, d, 'migration.sql'))
    );
    expect(all).toContain(NEW_MIGRATION);
    for (const d of LEGACY) expect(all).toContain(d);

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

    cpSync(join(MIGRATIONS, NEW_MIGRATION), join(tmp, 'migrations', NEW_MIGRATION), {
      recursive: true,
    });
    deploy();

    expect(psql(`select count(*) from "Video" where owner_id is null`)).toBe('2');
    expect(psql(`select count(*) from "Video" where title is null and duration_s is null`)).toBe('2');
    expect(psql(`select count(*) from "User"`)).toBe('0');
  });

  it('creates the expected User and Video columns, index and foreign key', () => {
    const cols = (table: string) =>
      psql(
        `select column_name || ':' || data_type || ':' || is_nullable from information_schema.columns ` +
          `where table_schema = 'public' and table_name = '${table}' order by column_name`
      ).split('\n');

    expect(cols('User')).toEqual([
      'created_at:bigint:NO',
      'password_hash:text:NO',
      'user_id:text:NO',
      'username:text:NO',
    ]);

    const video = cols('Video');
    expect(video).toContain('owner_id:text:YES');
    expect(video).toContain('title:text:YES');
    expect(video).toContain('duration_s:integer:YES');

    expect(
      psql(
        `select a.attname from pg_index i join pg_class c on c.oid = i.indrelid ` +
          `join pg_attribute a on a.attrelid = c.oid and a.attnum = any(i.indkey) ` +
          `where c.relname = 'User' and i.indisprimary`
      )
    ).toBe('user_id');

    expect(
      psql(
        `select i.indisunique::text || ':' || a.attname from pg_class ic join pg_index i on i.indexrelid = ic.oid ` +
          `join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey) ` +
          `where ic.relname = 'User_username_key'`
      )
    ).toBe('true:username');

    expect(
      psql(
        `select a.attname from pg_class ic join pg_index i on i.indexrelid = ic.oid ` +
          `join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey) ` +
          `where ic.relname = 'Video_owner_id_idx' and not i.indisunique`
      )
    ).toBe('owner_id');

    expect(
      psql(
        `select conrelid::regclass::text || ':' || confrelid::regclass::text || ':' || confdeltype::text || ':' || confupdtype::text || ':' ||` +
          `(select string_agg(attname, ',') from pg_attribute where attrelid = conrelid and attnum = any(conkey)) || ':' || ` +
          `(select string_agg(attname, ',') from pg_attribute where attrelid = confrelid and attnum = any(confkey)) ` +
          `from pg_constraint where conname = 'Video_owner_id_fkey' and contype = 'f'`
      )
    ).toBe('"Video":"User":n:c:owner_id:user_id');
  });

  it('keeps schema.prisma and the migrated database in agreement', () => {
    // exit code 0 means no drift; execFileSync throws on a non-zero exit
    execFileSync(
      'npx',
      [
        'prisma', 'migrate', 'diff',
        '--from-url', url,
        '--to-schema-datamodel', join(tmp, 'schema.prisma'),
        '--exit-code',
      ],
      {
        cwd: REPO_ROOT,
        env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
        encoding: 'utf8',
        stdio: 'pipe',
      }
    );
  });
});
