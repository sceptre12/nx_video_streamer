import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';

/** Cookie parsing and set/clear. The session value is itself a signed JWT, so no cookie signing secret. */
export default fp(async function (fastify: FastifyInstance) {
  await fastify.register(cookie);
});
