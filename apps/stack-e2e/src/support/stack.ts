import { execFileSync, spawnSync } from 'node:child_process';
import * as path from 'node:path';

export const PROJECT_NAME = 'nvs-run-1-20261117-st10';
export const REPO_ROOT = path.resolve(__dirname, '../../../..');

const LONG_RUNNING = ['postgres', 'redis', 'db-server', 'app-server', 'ui'];

function sh(cmd: string, args: string[], quiet = false): string {
  return execFileSync(cmd, args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: quiet ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'pipe', 'inherit'],
  }).trim();
}

export function compose(args: string[], quiet = false): string {
  return sh('docker', ['compose', '-p', PROJECT_NAME, ...args], quiet);
}

export function stackEnv(): void {
  // Creates the git-ignored .env if absent (an existing one is kept); never prints a secret.
  sh('bash', ['scripts/stack-env.sh'], true);
}

function inspect(service: string, format: string, all = false): string {
  const cid = compose(['ps', ...(all ? ['-a'] : []), '-q', service], true);
  if (!cid) return '';
  return sh('docker', ['inspect', '-f', format, cid.split('\n')[0]], true);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Polls until every long-running service is healthy and the one-shot seed exited 0. */
export async function waitForStack(timeoutMs = 240_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let last = '';
  while (Date.now() < deadline) {
    const states = LONG_RUNNING.map(
      (s) => `${s}=${inspect(s, '{{.State.Health.Status}}') || 'missing'}`
    );
    const seed = inspect('seed', '{{.State.Status}} {{.State.ExitCode}}', true) || 'missing';
    last = `${states.join(' ')} seed=${seed}`;
    if (seed.startsWith('exited') && seed !== 'exited 0') {
      throw new Error(`seed failed: ${seed}`);
    }
    if (states.every((s) => s.endsWith('=healthy')) && seed === 'exited 0') return;
    await sleep(3000);
  }
  printDiagnostics();
  throw new Error(`stack not ready before timeout: ${last}`);
}

/** Best-effort failure diagnostics to stderr (teardown removes the containers); never masks the original error. */
function printDiagnostics(): void {
  const attempts: Array<[string, () => string]> = [
    ['compose ps -a', () => compose(['ps', '-a'], true)],
    ['ui logs (last 60)', () => compose(['logs', '--no-color', '--tail', '60', 'ui'], true)],
    ['ui health', () => inspect('ui', '{{json .State.Health}}', true)],
  ];
  for (const [label, run] of attempts) {
    try {
      process.stderr.write(`--- ${label} ---\n${run()}\n`);
    } catch {
      // diagnostics are best-effort
    }
  }
}

export function stackUp(): void {
  // apps/app1/Dockerfile COPYs dist/apps/app1; the image build has no network, so build the UI first.
  sh('npx', ['--no-install', 'nx', 'build', 'app1']);
  // umask 077 builds leave files 0600/dirs 0700, which COPY preserves and the non-root nginx worker cannot read (403).
  sh('chmod', ['-R', 'a+rX', 'dist/apps/app1']);
  // Long-running services first, then the one-shot seed (no --wait on an exiting container).
  compose(['up', '-d', '--build', ...LONG_RUNNING]);
  compose(['up', '-d', 'seed']);
}

export function stackDown(): void {
  const r = spawnSync('docker', ['compose', '-p', PROJECT_NAME, 'down', '-v'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  if (r.status !== 0) throw new Error(`docker compose down -v exited ${r.status}`);
}
