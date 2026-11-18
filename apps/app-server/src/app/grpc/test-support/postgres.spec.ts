import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { startPostgres } from './postgres';

describe('startPostgres without docker', () => {
  const saved = { PATH: process.env.PATH, DOCKER_HOST: process.env.DOCKER_HOST };

  afterEach(() => {
    process.env.PATH = saved.PATH;
    if (saved.DOCKER_HOST === undefined) delete process.env.DOCKER_HOST;
    else process.env.DOCKER_HOST = saved.DOCKER_HOST;
  });

  it('fails with an explicit docker-daemon message', async () => {
    process.env.PATH = mkdtempSync(join(tmpdir(), 'no-docker-'));
    delete process.env.DOCKER_HOST;
    await expect(startPostgres('nodocker')).rejects.toThrow(/docker daemon not reachable/);
  });
});
