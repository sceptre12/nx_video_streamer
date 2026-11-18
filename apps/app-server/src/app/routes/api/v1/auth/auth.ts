/**
 * /api/v1/auth: register, login, logout, me (contracts/api-http.md).
 * register, login and logout are public (auth/hook.ts PUBLIC_ROUTES); me is protected by the hook.
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { SESSION_COOKIE, SESSION_TTL_SECONDS, cookieSecure, getJwtSecret } from '../../../../auth/config';
import { sendError } from '../../../../auth/errors';
import { dummyCompare, hashPassword, verifyPassword } from '../../../../auth/password';
import { CredentialsBody, hasStringCredentials, loginSchema, registerSchema } from '../../../../auth/schemas';
import { signSessionToken } from '../../../../auth/token';
import { createUser, getUserByUsername, getUserById } from '../../../../grpc/services';
import type { ErrorResponseParam } from '../../../utils/errorHandler';

const cookieOptions = () => ({
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: cookieSecure(),
});

/** Collects the first error a grpc wrapper reports so the route can map it to the contract shape. */
const collectError = () => {
  const seen: ErrorResponseParam[] = [];
  return { seen, errorHandler: (e: ErrorResponseParam) => void seen.push(e) };
};

/** preValidation: raw body must carry string username and password (no ajv type coercion). */
const requireStrings = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!hasStringCredentials(request.body)) return sendError(reply, 400, 'invalid_input', 'invalid input');
};

const sendInternal = (reply: FastifyReply) => sendError(reply, 500, 'internal_error', 'internal error');

export default async function (fastify: FastifyInstance) {
  const secret = getJwtSecret();

  // Validation failures on these routes answer 400 invalid_input in the contract shape
  fastify.setErrorHandler((error, request, reply) => {
    if (error.validation || error.statusCode === 400) {
      return sendError(reply, 400, 'invalid_input', 'invalid input');
    }
    request.log.error({ err: error }, 'auth route error');
    return sendInternal(reply);
  });

  fastify.post<{ Body: CredentialsBody }>('/register', { schema: registerSchema, preValidation: requireStrings }, async (request, reply) => {
    const { username, password } = request.body;
    const password_hash = await hashPassword(password);
    const e = collectError();
    const user = await createUser({ requestObject: { username, password_hash }, callBack: () => undefined, errorHandler: e.errorHandler });
    if (!user) {
      if (e.seen[0]?.code === 409) return sendError(reply, 409, 'username_taken', 'username already taken');
      if (e.seen[0]?.code === 400) return sendError(reply, 400, 'invalid_input', 'invalid input');
      request.log.error({ err: e.seen[0]?.error }, 'register failed');
      return sendInternal(reply);
    }
    return reply.status(201).send({ version: 'v1', user_id: user.user_id, username: user.username });
  });

  fastify.post<{ Body: CredentialsBody }>('/login', { schema: loginSchema, preValidation: requireStrings }, async (request, reply) => {
    const { username, password } = request.body;
    const e = collectError();
    const user = await getUserByUsername({ requestObject: { username }, callBack: () => undefined, errorHandler: e.errorHandler });
    if (e.seen.length > 0) {
      request.log.error({ err: e.seen[0].error }, 'login lookup failed');
      return sendInternal(reply);
    }
    // Unknown user: still spend a bcrypt compare, then answer the same as a wrong password
    const ok = user ? await verifyPassword(password, user.password_hash) : (await dummyCompare(password), false);
    if (!user || !ok) {
      // username only; never the password or the request body
      request.log.warn({ username }, 'login failed');
      return sendError(reply, 401, 'invalid_credentials', 'invalid username or password');
    }
    const token = signSessionToken(user.user_id, secret);
    reply.setCookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_TTL_SECONDS });
    return reply.status(200).send({ version: 'v1', user_id: user.user_id, username: user.username });
  });

  fastify.post('/logout', async (_request, reply) => {
    reply.clearCookie(SESSION_COOKIE, cookieOptions());
    return reply.status(204).send();
  });

  fastify.get('/me', async (request, reply) => {
    const e = collectError();
    const user = await getUserById({ requestObject: { user_id: request.sessionUserId as string }, callBack: () => undefined, errorHandler: e.errorHandler });
    if (e.seen.length > 0) {
      request.log.error({ err: e.seen[0].error }, 'me lookup failed');
      return sendInternal(reply);
    }
    if (!user) return sendError(reply, 401, 'unauthenticated', 'authentication required');
    reply.header('Cache-Control', 'private, no-store');
    return reply.status(200).send({ version: 'v1', user_id: user.user_id, username: user.username });
  });
}
