import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { DbComServiceClient as _src_video_v1_DbComServiceClient, DbComServiceDefinition as _src_video_v1_DbComServiceDefinition } from './src/video/v1/DbComService';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  src: {
    video: {
      v1: {
        CreateUserRequest: MessageTypeDefinition
        CreateUserResponse: MessageTypeDefinition
        CreateVideoRequest: MessageTypeDefinition
        CreateVideoResponse: MessageTypeDefinition
        DbComService: SubtypeConstructor<typeof grpc.Client, _src_video_v1_DbComServiceClient> & { service: _src_video_v1_DbComServiceDefinition }
        GetUserByIdRequest: MessageTypeDefinition
        GetUserByUsernameRequest: MessageTypeDefinition
        GetUserResponse: MessageTypeDefinition
        GetVideoForOwnerRequest: MessageTypeDefinition
        GetVideoRequest: MessageTypeDefinition
        GetVideoResponse: MessageTypeDefinition
        GetVideosRequest: MessageTypeDefinition
        GetVideosResponse: MessageTypeDefinition
        ListVideosByOwnerRequest: MessageTypeDefinition
        StartVideoStreamRequest: MessageTypeDefinition
        StartVideoStreamResponse: MessageTypeDefinition
        StopUploadStreamRequest: MessageTypeDefinition
        StopUploadStreamResponse: MessageTypeDefinition
        UpdateVideoStreamingStateRequest: MessageTypeDefinition
        UpdateVideoStreamingStateResponse: MessageTypeDefinition
        User: MessageTypeDefinition
        VideoItem: MessageTypeDefinition
      }
    }
  }
}

