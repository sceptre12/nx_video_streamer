import videoGrpcClient from '../index';
import { fromVideo, fromVideoList, toWire, VideoRecord } from '../casing';
import { callUnary, UnaryParams } from './callUnary';
import type { ListVideosByOwnerRequest } from 'protos/libs/gen/protobuf-types/src/video/v1/ListVideosByOwnerRequest';
import type { GetVideoForOwnerRequest } from 'protos/libs/gen/protobuf-types/src/video/v1/GetVideoForOwnerRequest';

export const listVideosByOwner = (p: UnaryParams<{ owner_id: string }, VideoRecord[]>) =>
  callUnary((req, cb) => videoGrpcClient.ListVideosByOwner(toWire<ListVideosByOwnerRequest>(req), cb), fromVideoList, p);

/** GetVideoForOwner: NOT_FOUND (HTTP 404 code to the error handler) when missing or owned by another user. */
export const getVideoForOwner = (p: UnaryParams<{ video_id: string; owner_id: string }, VideoRecord>) =>
  callUnary((req, cb) => videoGrpcClient.GetVideoForOwner(toWire<GetVideoForOwnerRequest>(req), cb), fromVideo, p);
