import videoGrpcClient from '../index'
import { toWire } from '../casing';
import { callUnary, UnaryParams } from './callUnary';
import type { UpdateVideoStreamingStateResponse } from 'protos/libs/gen/protobuf-types/src/video/v1/UpdateVideoStreamingStateResponse';
import type { UpdateVideoStreamingStateRequest } from 'protos/libs/gen/protobuf-types/src/video/v1/UpdateVideoStreamingStateRequest';

/**
 * Tells the db server a video's streaming state changed. `owner_id` is required: the db server
 * updates only where the row's owner matches, else NOT_FOUND.
 */
export const updateVideoStreamingState = (
  p: UnaryParams<{ video_id: string; has_streaming_started: boolean; owner_id: string }, UpdateVideoStreamingStateResponse & { update_complete: boolean }>
) =>
  callUnary(
    (req, cb) => videoGrpcClient.UpdateVideoStreamingState(toWire<UpdateVideoStreamingStateRequest>(req), cb),
    (raw) => ({ update_complete: Boolean((raw as { update_complete?: unknown } | null)?.update_complete) }),
    p
  );
