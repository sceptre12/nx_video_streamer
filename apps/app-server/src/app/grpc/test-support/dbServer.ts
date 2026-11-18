import { ChildProcess, spawn } from 'child_process';
import { randomBytes } from 'crypto';
import { existsSync, mkdtempSync } from 'fs';
import { createServer } from 'net';
import { tmpdir } from 'os';
import { join } from 'path';
import { REPO_ROOT } from './postgres';

/** Picks a free port by binding port 0 and reading it back. */
export const freePort = (): Promise<number> =>
  new Promise((res, rej) => {
    const s = createServer();
    s.once('error', rej);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address() as { port: number };
      s.close(() => res(port));
    });
  });

export interface DbServerChild {
  proc: ChildProcess;
  port: number;
  grpcPort: number;
  /** the value of DB_GRPC_ADDR for an app-server client talking to this child */
  grpcAddr: string;
  output: () => string;
  stop: () => Promise<void>;
}

/**
 * Spawns the built db-server (`node dist/apps/db-server/main.js`, from the repo root; `npx nx build
 * db-server` must have run first) on free ports: env PORT (fastify, socket.io) and GRPC_PORT (gRPC).
 * Pick-then-bind can collide, so the spawn is retried with new ports on EADDRINUSE, at most 3 attempts.
 * `env` carries DATABASE_URL and DIRECT_URL; JWT_SECRET (random, in memory) and a per-spec
 * VIDEO_STORAGE_DIR are set here unless the caller passes them. No secret literal.
 * `DB_SERVER_MAIN` (path to main.js) overrides the default entry, for a build made in another checkout.
 */
export async function startDbServer(env: Record<string, string>): Promise<DbServerChild> {
  const main = process.env.DB_SERVER_MAIN || 'dist/apps/db-server/main.js';
  if (!existsSync(join(REPO_ROOT, main)) && !existsSync(main)) {
    throw new Error(`${main} not found: run \`npx nx build db-server\` first`);
  }
  const storage = mkdtempSync(join(tmpdir(), 'app-server-grpc-spec-'));
  let lastOutput = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    const port = await freePort();
    const grpcPort = await freePort();
    const grpcAddr = `127.0.0.1:${grpcPort}`;
    let out = '';
    const proc = spawn('node', [main], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        JWT_SECRET: randomBytes(32).toString('hex'),
        VIDEO_STORAGE_DIR: storage,
        ...env,
        PORT: String(port),
        GRPC_PORT: String(grpcPort),
        DB_GRPC_ADDR: grpcAddr,
      },
    });
    proc.stdout?.on('data', (d) => (out += d));
    proc.stderr?.on('data', (d) => (out += d));
    const stop = () =>
      new Promise<void>((res) => {
        if (proc.exitCode !== null) return res();
        proc.once('exit', () => res());
        proc.kill('SIGTERM');
      });
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      if (proc.exitCode !== null || /EADDRINUSE/.test(out)) break;
      if (out.includes('Launched Grpc Server')) {
        return { proc, port, grpcPort, grpcAddr, output: () => out, stop };
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    lastOutput = out;
    await stop();
    if (!/EADDRINUSE/.test(out)) break;
  }
  throw new Error('db-server did not start: ' + lastOutput);
}
