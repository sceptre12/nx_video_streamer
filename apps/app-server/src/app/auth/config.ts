/** Auth configuration read from the environment (contracts/runtime-env-ports.md, api-http.md Session). */

export const SESSION_COOKIE = 'nvs_session';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
export const JWT_ALGORITHM = 'HS256' as const;
export const MIN_SECRET_BYTES = 32;
export const BCRYPT_COST = 10;

/** JWT_SECRET has no default; fewer than 32 bytes (or unset) is a startup failure. */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set: app-server refuses to start without it');
  }
  if (Buffer.byteLength(secret, 'utf8') < MIN_SECRET_BYTES) {
    throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_BYTES} bytes`);
  }
  return secret;
}

/** Secure cookie flag only when COOKIE_SECURE=true. */
export const cookieSecure = (): boolean => process.env.COOKIE_SECURE === 'true';
