import * as grpc from '@grpc/grpc-js'
import { updateVideoStreamingState } from '../../db/video/update/updateVideoStreamingState'
import { GrpcError, unary } from './mappers'

// Updates only where the owner matches; otherwise NOT_FOUND.
export const handleUpdatingStreamingState = unary(async (request) => {
  const {video_id, has_streaming_started, owner_id} = request;
  if (!video_id) throw new GrpcError(grpc.status.INVALID_ARGUMENT, 'video_id is required');
  const count = await updateVideoStreamingState({video_id, has_streaming_started: !!has_streaming_started, owner_id});
  if (count === 0) throw new GrpcError(grpc.status.NOT_FOUND, 'video not found');
  return {update_complete: true};
})
