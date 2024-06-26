/**
 * This file handles CRUD request to
 * /api/v1/video
 */

import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.post('/api/v1/video', async function (request, reply) {
    return { message: 'Hello API' };
  });
}