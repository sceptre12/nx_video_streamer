import videoGrpcClient from '../index'
import { fromVideo, toWire, VideoRecord } from '../casing';
import { callUnary, UnaryParams } from './callUnary';
import type { CreateVideoRequest } from 'protos/libs/gen/protobuf-types/src/video/v1/CreateVideoRequest';

/**
 * Sends a message through the grpc service to the db server to create a new video record owned by
 * `owner_id` (CreateVideo answers INVALID_ARGUMENT on an empty owner_id). The callback gets the
 * created video in its snake_case shape: `{results: VideoRecord}` as before.
 */
export const createVideo = (
  p: UnaryParams<{ video_id: string; start_time: number; owner_id: string }, { results: VideoRecord }>
) =>
  callUnary(
    (req, cb) => videoGrpcClient.CreateVideo(toWire<CreateVideoRequest>(req), cb),
    (raw) => ({ results: fromVideo((raw as { results?: unknown } | null)?.results) }),
    p
  );
