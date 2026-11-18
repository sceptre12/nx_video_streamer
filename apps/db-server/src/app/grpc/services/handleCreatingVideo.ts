/**
 * CreateVideo: validates the video_id, creates the row and the folder under VIDEO_STORAGE_DIR
 * in one transaction, and replies with paths relative to VIDEO_STORAGE_DIR.
 * Bad id -> INVALID_ARGUMENT (no directory created); duplicate id -> ALREADY_EXISTS.
 */
import {mkdir} from 'node:fs/promises'
import * as grpc from '@grpc/grpc-js'
import path from 'path'
import { createVideo } from '../../db/video/create/createVideo'
import { VIDEO_STORAGE_DIR, VIDEO_ID_PATTERN } from '../../utils/constants'
import { GrpcError, toVideoItem, unary } from './mappers'

export const handleCreatingVideoService = unary(async (request) => {
  const {video_id, start_time, owner_id} = request;
  if (typeof video_id !== 'string' || !VIDEO_ID_PATTERN.test(video_id)) {
    throw new GrpcError(grpc.status.INVALID_ARGUMENT, 'video_id must match ^[A-Za-z0-9_-]{1,64}$');
  }
  const start = Number(start_time);
  if (!Number.isFinite(start) || start <= 0) {
    throw new GrpcError(grpc.status.INVALID_ARGUMENT, 'start_time is required');
  }

  const video_path = `${video_id}/${video_id}.mp4`;
  const thumbnail_path = `${video_id}/thumbnail_${video_id}.webp`;

  try {
    const row = await createVideo(
      {video_id, start_time: start, video_path, thumbnail_path, is_streaming: false, owner_id},
      async () => {
        await mkdir(VIDEO_STORAGE_DIR, {recursive: true});
        // non-recursive: an existing folder is a clash
        await mkdir(path.join(VIDEO_STORAGE_DIR, video_id));
      }
    );
    return {results: toVideoItem(row)};
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new GrpcError(grpc.status.ALREADY_EXISTS, `video ${video_id} already exists`);
    }
    throw e;
  }
})
