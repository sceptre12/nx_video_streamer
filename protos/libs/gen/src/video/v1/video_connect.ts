// @generated by protoc-gen-connect-es v1.4.0 with parameter "target=ts"
// @generated from file src/video/v1/video.proto (package src.video.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { CreateVideoRequest, CreateVideoResponse, GetVideoRequest, GetVideoResponse, GetVideosRequest, GetVideosResponse, StartVideoStreamRequest, StartVideoStreamResponse, StopUploadStreamRequest, StopUploadStreamResponse, UpdateVideoStreamingStateRequest, UpdateVideoStreamingStateResponse } from "./video_pb.js";
import { MethodKind } from "@bufbuild/protobuf";

/**
 * https://protobuf.dev/programming-guides/proto3/#services
 * Service allows us to define an RPC interface
 *
 * @generated from service src.video.v1.DbComService
 */
export const DbComService = {
  typeName: "src.video.v1.DbComService",
  methods: {
    /**
     * Queries the db for all of the videos and returns the objects
     *
     * @generated from rpc src.video.v1.DbComService.GetVideos
     */
    getVideos: {
      name: "GetVideos",
      I: GetVideosRequest,
      O: GetVideosResponse,
      kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc src.video.v1.DbComService.GetVideo
     */
    getVideo: {
      name: "GetVideo",
      I: GetVideoRequest,
      O: GetVideoResponse,
      kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc src.video.v1.DbComService.CreateVideo
     */
    createVideo: {
      name: "CreateVideo",
      I: CreateVideoRequest,
      O: CreateVideoResponse,
      kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc src.video.v1.DbComService.UpdateVideoStreamingState
     */
    updateVideoStreamingState: {
      name: "UpdateVideoStreamingState",
      I: UpdateVideoStreamingStateRequest,
      O: UpdateVideoStreamingStateResponse,
      kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc src.video.v1.DbComService.StopUploadStream
     */
    stopUploadStream: {
      name: "StopUploadStream",
      I: StopUploadStreamRequest,
      O: StopUploadStreamResponse,
      kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc src.video.v1.DbComService.StartVideoStream
     */
    startVideoStream: {
      name: "StartVideoStream",
      I: StartVideoStreamRequest,
      O: StartVideoStreamResponse,
      kind: MethodKind.Unary,
    },
  }
} as const;

