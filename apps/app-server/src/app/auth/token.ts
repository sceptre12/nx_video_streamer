import * as jwt from 'jsonwebtoken';
import { JWT_ALGORITHM, SESSION_TTL_SECONDS } from './config';

/** HS256 JWT with `sub` = user_id and `exp` = issue time + 8 h. */
export const signSessionToken = (userId: string, secret: string): string =>
  jwt.sign({}, secret, { algorithm: JWT_ALGORITHM, subject: userId, expiresIn: SESSION_TTL_SECONDS });

/** Returns the user id of a valid token, else null. Only HS256 is accepted; `exp` and `sub` are required. */
export function verifySessionToken(token: string, secret: string): string | null {
  try {
    const payload = jwt.verify(token, secret, { algorithms: [JWT_ALGORITHM] });
    if (typeof payload === 'string') return null;
    if (typeof payload.sub !== 'string' || payload.sub === '' || typeof payload.exp !== 'number') return null;
    return payload.sub;
  } catch {
    return null;
  }
}
