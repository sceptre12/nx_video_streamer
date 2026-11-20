import Redis from 'ioredis';

/** contracts/cache-keys.md key table: TTLs in seconds. */
export const LIBRARY_TTL_S = 60;
export const USER_TTL_S = 300;

export const libraryKey = (userId: string): string => `lib:v1:${userId}`;
export const userKey = (userId: string): string => `user:v1:${userId}`;

let client: Redis | null = null;
let clientUrl: string | undefined;

const warn = (op: string, err: unknown): void => {
  const msg = err instanceof Error ? err.message : String(err);
  console.warn(`[cache] ${op} failed, treating as MISS: ${msg}`);
};

/** Single lazily created client built from REDIS_URL; null when REDIS_URL is unset (cache disabled, fail open). */
export function getClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (client && clientUrl === url) return client;
  if (client) client.disconnect();
  clientUrl = url;
  client = new Redis(url, {
    maxRetriesPerRequest: 1,
    connectTimeout: 500,
    commandTimeout: 500,
    retryStrategy: (times) => Math.min(times * 200, 2000),
  });
  client.on('error', (err) => warn('connection', err));
  return client;
}

/** Closes the client (spec teardown, shutdown). */
export async function closeClient(): Promise<void> {
  const c = client;
  client = null;
  clientUrl = undefined;
  if (c) c.disconnect();
}

/** Read: returns the parsed JSON value, or null on a MISS or any Redis error (never throws). */
export async function readJson<T>(key: string): Promise<T | null> {
  try {
    const c = getClient();
    if (!c) return null;
    const raw = await c.get(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch (err) {
    warn(`get ${key}`, err);
    return null;
  }
}

/** Write with a TTL; a Redis error is logged and swallowed. */
export async function writeJson(key: string, value: unknown, ttlS: number): Promise<void> {
  try {
    const c = getClient();
    if (!c) return;
    await c.set(key, JSON.stringify(value), 'EX', ttlS);
  } catch (err) {
    warn(`set ${key}`, err);
  }
}

/** Deletes exactly one key; a Redis error is logged and swallowed. */
export async function deleteKey(key: string): Promise<void> {
  try {
    const c = getClient();
    if (!c) return;
    await c.del(key);
  } catch (err) {
    warn(`del ${key}`, err);
  }
}
