/**
 * GET /api/v1/videos/{video_id}/stream (contracts/api-http.md): the caller's MP4 with single-range
 * support (200, 206, 416). Behind the global auth hook, so the cookie check (401) precedes the
 * ownership check; a missing, not-owned or legacy owner_id NULL video is 404 `not_found` (no 403),
 * as is a stored path outside VIDEO_STORAGE_DIR. Bytes are read from the volume, never cached.
 */
import { createReadStream } from 'fs';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type {} from '../../../../auth/hook'; // brings in the FastifyRequest.sessionUserId augmentation
import { sendError } from '../../../../auth/errors';
import { getVideoForOwner } from '../../../../grpc/services';
import type { ErrorResponseParam } from '../../../utils/errorHandler';
import { parseRange } from './range';
import { resolveVideoFile } from './storage';

interface StreamParams {
  video_id: string;
}

const etagOf = (size: number, mtimeMs: number) => `"${size.toString(16)}-${Math.floor(mtimeMs).toString(16)}"`;

const logStream = (request: FastifyRequest, video_id: string, status: number, range: string | undefined) =>
  request.log.info({ user_id: request.sessionUserId, video_id, status, range: range ?? null }, 'video stream');

export default async function (fastify: FastifyInstance) {
  fastify.get<{ Params: StreamParams }>('/:video_id/stream', async (request, reply: FastifyReply) => {
    const { video_id } = request.params;
    const rangeHeader = request.headers.range;
    const done = (status: number) => logStream(request, video_id, status, rangeHeader);

    const seen: ErrorResponseParam[] = [];
    const video = await getVideoForOwner({
      requestObject: { video_id, owner_id: request.sessionUserId as string },
      callBack: () => undefined,
      errorHandler: (e) => void seen.push(e),
    });
    if (seen[0]?.code === 404) {
      done(404);
      return sendError(reply, 404, 'not_found', 'video not found');
    }
    if (seen.length > 0 || !video) {
      request.log.error({ err: seen[0]?.error, video_id }, 'video stream lookup failed');
      done(500);
      return sendError(reply, 500, 'internal_error', 'internal error');
    }

    const file = await resolveVideoFile(video.video_path);
    if (!file) {
      done(404);
      return sendError(reply, 404, 'not_found', 'video not found');
    }

    const total = file.stats.size;
    const parsed = parseRange(rangeHeader, total);
    if (parsed.kind === 'unsatisfiable') {
      done(416);
      reply.header('Content-Range', `bytes */${total}`);
      return sendError(reply, 416, 'range_not_satisfiable', 'range not satisfiable');
    }

    reply
      .header('Accept-Ranges', 'bytes')
      .header('Content-Type', 'video/mp4')
      .header('ETag', etagOf(total, file.stats.mtimeMs))
      .header('Cache-Control', 'private, max-age=300')
      .header('Vary', 'Cookie');

    if (parsed.kind === 'full') {
      done(200);
      reply.header('Content-Length', String(total));
      // bound the read to the stat'd size: capture may still be appending, and Content-Length must hold
      if (total === 0) return reply.status(200).send(Buffer.alloc(0));
      return reply.status(200).send(createReadStream(file.path, { start: 0, end: total - 1 }));
    }

    const { start, end } = parsed.range;
    done(206);
    reply.header('Content-Range', `bytes ${start}-${end}/${total}`).header('Content-Length', String(end - start + 1));
    return reply.status(206).send(createReadStream(file.path, { start, end }));
  });
}
