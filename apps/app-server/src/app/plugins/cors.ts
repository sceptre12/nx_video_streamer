import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import cors from '@fastify/cors';

const isLocalhost = (origin: string): boolean => {
  try {
    return new URL(origin).hostname === 'localhost';
  } catch {
    return false;
  }
};

export default fp(async function (fastify: FastifyInstance) {
  fastify.register(cors, {
    origin: (origin, cb) => {
      // No Origin header (same-origin, curl, server-to-server): nothing to check, never throw
      if (!origin) {
        cb(null, true);
        return;
      }
      // Request from localhost will pass
      if (isLocalhost(origin)) {
        cb(null, true);
        return;
      }
      // Generate an error on other origins, disabling access
      cb(new Error('Not allowed'), false);
    },
  });
});
