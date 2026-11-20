/**
 * This file handles CRUD request to
 * /api/v1/video
 * Both routes sit behind the global auth hook (401 unauthenticated); the owner is the verified
 * session user, never a body field.
 */
import {createVideoOpts, updateVideoStreamingStateOpts} from './video_schema'
import { FastifyInstance, FastifyReply } from 'fastify';
import type {ICreateVideoBody, IUpdateVideoStreamingStateBody, IUpdateVideoStreamingStateParams} from './video_schema'
import { createVideo, updateVideoStreamingState } from './../../../../grpc/services';
import type {} from './../../../../auth/hook'; // brings in the FastifyRequest.sessionUserId augmentation
import { sendError } from './../../../../auth/errors';
import { invalidateLibrary } from './../../../../cache';
import type { ErrorResponseParam } from '../../../utils/errorHandler';

/** Collects the first error a grpc wrapper reports so the route can map it to the contract shape. */
const collectError = () => {
  const seen: ErrorResponseParam[] = [];
  return { seen, errorHandler: (e: ErrorResponseParam) => void seen.push(e) };
};

const sendInternal = (reply: FastifyReply) => sendError(reply, 500, 'internal_error', 'internal error');

export default async function(fastify: FastifyInstance) {

  // Validation failures answer 400 invalid_input in the contract shape
  fastify.setErrorHandler((error, request, reply) => {
    if (error.validation || error.statusCode === 400) {
      return sendError(reply, 400, 'invalid_input', 'invalid input');
    }
    request.log.error({ err: error }, 'video route error');
    return sendInternal(reply);
  });

  fastify.post<{Body: ICreateVideoBody}>('/create',createVideoOpts, async (request, reply) =>{
    const {video_id, start_time } = request.body
    const e = collectError();

    // Create the video in the db server and respond to the client with the results
    const created = await createVideo({
      requestObject: {
        video_id, start_time, owner_id: request.sessionUserId as string
      },
      callBack: () => undefined,
      errorHandler: e.errorHandler
    });
    if (!created) {
      const code = e.seen[0]?.code;
      if (code === 409) return sendError(reply, 409, 'video_exists', 'video already exists');
      if (code === 400) return sendError(reply, 400, 'invalid_input', 'invalid input');
      request.log.error({ err: e.seen[0]?.error }, 'create video failed');
      return sendInternal(reply);
    }
    await invalidateLibrary(request.sessionUserId as string);
    return reply.send({ version: 'v1', ...created.results });
  })



  fastify.post<{Body: IUpdateVideoStreamingStateBody, Params: IUpdateVideoStreamingStateParams }>('/:video_id',updateVideoStreamingStateOpts, async (request,reply) =>{
    const {video_id} = request.params;
    // This can be expaneded over time
    const {has_streaming_started} = request.body
    const e = collectError();

    const updated = await updateVideoStreamingState({
      requestObject: {
        video_id,
        has_streaming_started,
        owner_id: request.sessionUserId as string
      },
      callBack: () => undefined,
      errorHandler: e.errorHandler
    })
    if (!updated) {
      const code = e.seen[0]?.code;
      if (code === 404) return sendError(reply, 404, 'not_found', 'video not found');
      if (code === 400) return sendError(reply, 400, 'invalid_input', 'invalid input');
      request.log.error({ err: e.seen[0]?.error }, 'update video failed');
      return sendInternal(reply);
    }
    await invalidateLibrary(request.sessionUserId as string);
    return reply.send({ version: 'v1', ...updated })
  })
}
