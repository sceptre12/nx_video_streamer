import { execFileSync } from 'child_process';
import { randomBytes } from 'crypto';
import { resolve } from 'path';

const ORBSTACK_SOCKET = 'unix:///Users/xavier/.orbstack/run/docker.sock';

/** Repo root: the db-server child must be spawned from here (VIDEO_PROTO_PATH is cwd-relative). */
export const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..', '..', '..');

export interface ThrowawayPostgres {
  /** used for both DATABASE_URL and DIRECT_URL */
  url: string;
  stop: () => void;
}

function dockerEnv(): NodeJS.ProcessEnv {
  if (process.env.DOCKER_HOST) return process.env;
  try {
    execFileSync('docker', ['version', '--format', '{{.Server.Version}}'], { stdio: 'pipe' });
    return process.env;
  } catch {
    // DEFAULT: the OrbStack socket, only when the caller's docker is unreachable
    return { ...process.env, DOCKER_HOST: ORBSTACK_SOCKET };
  }
}

/**
 * Starts a throwaway postgres:16 on a random host port (read back with `docker port`), runs
 * `prisma migrate deploy` and returns its URL. The container name carries a random suffix and the
 * password is generated in memory; stop() removes the container.
 */
export async function startPostgres(prefix: string): Promise<ThrowawayPostgres> {
  const env = dockerEnv();
  const docker = (args: string[]) =>
    execFileSync('docker', args, { env, encoding: 'utf8', stdio: 'pipe' }).trim();
  try {
    docker(['version', '--format', '{{.Server.Version}}']);
  } catch {
    throw new Error(
      'docker daemon not reachable: these specs start a throwaway postgres:16 and need a running docker (set DOCKER_HOST or start the daemon); they also need a built dist/apps/db-server/main.js (npx nx build db-server)',
    );
  }
  const name = `${prefix}-${randomBytes(4).toString('hex')}`;
  const password = randomBytes(12).toString('hex');
  docker(['run', '-d', '--name', name, '-e', `POSTGRES_PASSWORD=${password}`, '-p', '127.0.0.1::5432', 'postgres:16']);
  const stop = () => {
    try { docker(['rm', '-f', name]); } catch { /* already gone */ }
  };
  try {
    const port = docker(['port', name, '5432/tcp']).split('\n')[0].split(':').pop();
    const url = `postgresql://postgres:${password}@127.0.0.1:${port}/postgres`;
    let ready = false;
    for (let i = 0; i < 60 && !ready; i++) {
      try {
        docker(['exec', name, 'pg_isready', '-U', 'postgres']);
        docker(['exec', name, 'psql', '-U', 'postgres', '-d', 'postgres', '-At', '-c', 'select 1']);
        ready = true;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    if (!ready) throw new Error('postgres did not become ready');
    execFileSync('npx', ['prisma', 'migrate', 'deploy', '--schema', 'apps/db-server/prisma/schema.prisma'], {
      cwd: REPO_ROOT,
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
      stdio: 'pipe',
    });
    return { url, stop };
  } catch (e) {
    stop();
    throw e;
  }
}
