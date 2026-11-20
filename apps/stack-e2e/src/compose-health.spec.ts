import { test, expect } from '@playwright/test';
import { compose, PROJECT_NAME } from './support/stack';

const LONG_RUNNING = ['postgres', 'redis', 'db-server', 'app-server', 'ui'];

interface PsRow {
  Service: string;
  State: string;
  Health?: string;
  ExitCode?: number;
}

/** `docker compose -p <project> ps -a --format json` prints a JSON array or one object per line, by version. */
function psAll(): PsRow[] {
  const out = compose(['ps', '-a', '--format', 'json'], true);
  if (!out) return [];
  if (out.startsWith('[')) return JSON.parse(out) as PsRow[];
  return out
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as PsRow);
}

function summary(rows: PsRow[]): string {
  return rows
    .map((r) => `${r.Service}=${r.State}/${r.Health || '-'}/${r.ExitCode ?? '-'}`)
    .sort()
    .join(' ');
}

test.describe(`compose project ${PROJECT_NAME}`, () => {
  test('every long-running service is healthy and seed exited 0', async () => {
    test.setTimeout(150_000);

    await expect
      .poll(
        () => {
          const rows = psAll();
          const healthy = LONG_RUNNING.every((s) => {
            const row = rows.find((r) => r.Service === s);
            return row?.State === 'running' && row.Health === 'healthy';
          });
          const seed = rows.find((r) => r.Service === 'seed');
          const seedOk = seed?.State === 'exited' && seed.ExitCode === 0;
          return healthy && seedOk ? 'ready' : summary(rows);
        },
        { timeout: 120_000, intervals: [2000], message: 'compose services did not become ready' }
      )
      .toBe('ready');
  });
});
