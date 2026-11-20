import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { SESSION_COOKIE, getJwtSecret } from './config';
import { sendError } from './errors';
import { verifySessionToken } from './token';
import { getUser, isCacheReady, registerCacheShutdown, setUser } from '../cache';
import { getUserById } from '../grpc/services';

declare module 'fastify' {
  interface FastifyRequest {
    /** user id from the session cookie; set by the auth hook on protected routes */
    sessionUserId?: string;
    /** user resolved from the user:v1 cache (HIT) or getUserById (MISS); unset when the cache is off or unreachable */
    sessionUser?: { user_id: string; username: string };
  }
}

/** Routes under /api/v1 that need no session. Everything else under /api/v1 is protected by default. */
export const PUBLIC_ROUTES: ReadonlySet<string> = new Set([
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/auth/logout',
]);

const isProtected = (routeUrl: string | undefined): boolean =>
  !!routeUrl && routeUrl.startsWith('/api/v1/') && !PUBLIC_ROUTES.has(routeUrl);

/**
 * Global onRequest hook: a protected route answers 401 `unauthenticated` unless the `nvs_session`
 * cookie holds a valid HS256 JWT. Opt-out (public list) rather than opt-in, so later routes inherit it.
 * Throws at registration when JWT_SECRET is missing or short.
 */
export function registerAuthHook(fastify: FastifyInstance): void {
  const secret = getJwtSecret();
  fastify.decorateRequest('sessionUserId', undefined);
  fastify.decorateRequest('sessionUser', undefined);
  registerCacheShutdown(fastify);
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!isProtected(request.routeOptions?.url)) return;
    const token = request.cookies?.[SESSION_COOKIE];
    const userId = token ? verifySessionToken(token, secret) : null;
    if (!userId) {
      return sendError(reply, 401, 'unauthenticated', 'authentication required');
    }
    request.sessionUserId = userId;
    // The cache lookup follows JWT verification, never precedes it (contracts/cache-keys.md).
    // user:v1:{user_id} is read-through; skipped entirely when Redis is not configured.
    // Skipped when Redis is not configured or unreachable (fail open, no gRPC lookup).
    if (!process.env.REDIS_URL || !(await isCacheReady())) return;
    const cached = await getUser(userId);
    if (cached) {
      request.sessionUser = { user_id: cached.user_id, username: cached.username };
      return;
    }
    const user = await getUserById({
      requestObject: { user_id: userId },
      callBack: () => undefined,
      errorHandler: (e) => request.log.warn({ err: e.error }, 'user lookup for cache failed'),
    });
    if (user) {
      request.sessionUser = { user_id: user.user_id, username: user.username };
      await setUser(userId, user);
    }
  });
}
