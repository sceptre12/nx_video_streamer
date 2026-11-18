import type { FastifyReply } from 'fastify';

/** Error shape of every non-2xx JSON response (contracts/api-http.md). */
export const sendError = (reply: FastifyReply, status: number, code: string, message: string) =>
  reply.status(status).send({ version: 'v1', error: { code, message } });
