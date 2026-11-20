import { ChildProcess, spawn } from 'child_process';
import { createServer } from 'net';
import { REPO_ROOT } from './postgres';

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
  output: () => string;
  stop: () => Promise<void>;
}

/**
 * Spawns the built `dist/apps/db-server/main.js` from the repo root on free ports.
 * Pick-then-bind can collide, so on EADDRINUSE it retries with new ports, at most 3 attempts.
 * `env` carries DATABASE_URL, DIRECT_URL, JWT_SECRET, VIDEO_STORAGE_DIR, DB_GRPC_ADDR as needed.
 */
export async function startDbServer(env: Record<string, string>): Promise<DbServerChild> {
  let lastOutput = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    const port = await freePort();
    const grpcPort = await freePort();
    let out = '';
    const proc = spawn('node', ['dist/apps/db-server/main.js'], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        ...env,
        PORT: String(port),
        GRPC_PORT: String(grpcPort),
        DB_GRPC_ADDR: `127.0.0.1:${grpcPort}`,
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
      if (out.includes('Launched Grpc Server') && out.includes('[ ready ]')) {
        return { proc, port, grpcPort, output: () => out, stop };
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    lastOutput = out;
    await stop();
    if (!/EADDRINUSE/.test(out)) break;
  }
  throw new Error('db-server did not start: ' + lastOutput);
}
