import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { REPO_ROOT } from './stack';

/** Parses REPO_ROOT/.env (KEY=VALUE lines; blanks and # comments ignored). Read at call time, never cached. */
export function readEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  const text = readFileSync(path.join(REPO_ROOT, '.env'), 'utf8');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return out;
}

function requireKey(key: string): string {
  const value = readEnv()[key];
  if (value === undefined || value === '') {
    throw new Error(`required key ${key} is missing from .env`);
  }
  return value;
}

export function demoPassword(user: 'demo1' | 'demo2'): string {
  return requireKey(user === 'demo1' ? 'DEMO_USER1_PASSWORD' : 'DEMO_USER2_PASSWORD');
}

export function uiBaseUrl(): string {
  const port = process.env['UI_HOST_PORT'] || readEnv()['UI_HOST_PORT'] || '36000';
  return `http://localhost:${port}`;
}
