/**
 * GET /api/v1/library: the signed-in caller's videos (contracts/api-http.md).
 * Behind the global auth hook (401 unauthenticated); the owner is the verified session user,
 * never a request parameter. Legacy owner_id NULL rows are excluded by db-server ListVideosByOwner.
 */
import type { FastifyInstance } from 'fastify';
import type {} from '../../../../auth/hook'; // brings in the FastifyRequest.sessionUserId augmentation
import { sendError } from '../../../../auth/errors';
import { listVideosByOwner } from '../../../../grpc/services';
import type { ErrorResponseParam } from '../../../utils/errorHandler';
import { getLibrary, setLibrary } from '../../../../cache';
import { toLibraryVideo } from './library_mapper';

export default async function (fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    const owner = request.sessionUserId as string;
    const cached = await getLibrary(owner);
    if (cached) {
      reply.header('Cache-Control', 'private, no-store');
      reply.header('X-Cache', 'HIT');
      return reply.status(200).send(cached);
    }
    const seen: ErrorResponseParam[] = [];
    const list = await listVideosByOwner({
      requestObject: { owner_id: request.sessionUserId as string },
      callBack: () => undefined,
      errorHandler: (e) => void seen.push(e),
    });
    if (seen.length > 0 || !list) {
      request.log.error({ err: seen[0]?.error }, 'library lookup failed');
      return sendError(reply, 500, 'internal_error', 'internal error');
    }
    const videos = list.map(toLibraryVideo);
    request.log.info({ user_id: request.sessionUserId, video_count: videos.length }, 'library listed');
    const body = { version: 'v1', videos };
    await setLibrary(owner, body);
    reply.header('Cache-Control', 'private, no-store');
    reply.header('X-Cache', 'MISS');
    return reply.status(200).send(body);
  });
}
