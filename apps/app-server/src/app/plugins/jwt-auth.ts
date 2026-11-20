import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { registerAuthHook } from '../auth/hook';

/** Session auth hook for /api/v1; fails startup when JWT_SECRET is missing or shorter than 32 bytes. */
export default fp(async function (fastify: FastifyInstance) {
  registerAuthHook(fastify);
});
