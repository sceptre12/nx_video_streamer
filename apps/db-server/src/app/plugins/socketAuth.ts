import jwt from 'jsonwebtoken';

export const SESSION_COOKIE = 'nvs_session';

/** Hand parse of the Cookie header (no cookie-parsing dependency). */
export const readCookie = (header: string | undefined, name: string): string | undefined => {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) {
      const v = part.slice(i + 1).trim();
      try { return decodeURIComponent(v); } catch { return v; }
    }
  }
  return undefined;
};

/** Returns the user_id (`sub`) of a valid HS256 session token, else null. */
export const verifySessionToken = (token: string | undefined, secret: string): string | null => {
  if (!token) return null;
  try {
    const claims = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (typeof claims === 'object' && claims && typeof claims.sub === 'string' && claims.sub) return claims.sub;
  } catch { /* invalid, expired or wrong algorithm */ }
  return null;
};

/** socket.io middleware: refuses the handshake with `unauthenticated` unless the cookie holds a valid JWT. */
export const socketAuth = (secret: string) =>
  (socket: { handshake: { headers: { cookie?: string } }; data: Record<string, unknown> }, next: (err?: Error) => void) => {
    const user_id = verifySessionToken(readCookie(socket.handshake.headers.cookie, SESSION_COOKIE), secret);
    if (!user_id) return next(new Error('unauthenticated'));
    socket.data.user_id = user_id;
    next();
  };
