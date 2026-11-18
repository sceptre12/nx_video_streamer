// Original file: src/video/v1/video.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { CreateUserRequest as _src_video_v1_CreateUserRequest, CreateUserRequest__Output as _src_video_v1_CreateUserRequest__Output } from '../../../src/video/v1/CreateUserRequest';
import type { CreateUserResponse as _src_video_v1_CreateUserResponse, CreateUserResponse__Output as _src_video_v1_CreateUserResponse__Output } from '../../../src/video/v1/CreateUserResponse';
import type { CreateVideoRequest as _src_video_v1_CreateVideoRequest, CreateVideoRequest__Output as _src_video_v1_CreateVideoRequest__Output } from '../../../src/video/v1/CreateVideoRequest';
import type { CreateVideoResponse as _src_video_v1_CreateVideoResponse, CreateVideoResponse__Output as _src_video_v1_CreateVideoResponse__Output } from '../../../src/video/v1/CreateVideoResponse';
import type { GetUserByIdRequest as _src_video_v1_GetUserByIdRequest, GetUserByIdRequest__Output as _src_video_v1_GetUserByIdRequest__Output } from '../../../src/video/v1/GetUserByIdRequest';
import type { GetUserByUsernameRequest as _src_video_v1_GetUserByUsernameRequest, GetUserByUsernameRequest__Output as _src_video_v1_GetUserByUsernameRequest__Output } from '../../../src/video/v1/GetUserByUsernameRequest';
import type { GetUserResponse as _src_video_v1_GetUserResponse, GetUserResponse__Output as _src_video_v1_GetUserResponse__Output } from '../../../src/video/v1/GetUserResponse';
import type { GetVideoForOwnerRequest as _src_video_v1_GetVideoForOwnerRequest, GetVideoForOwnerRequest__Output as _src_video_v1_GetVideoForOwnerRequest__Output } from '../../../src/video/v1/GetVideoForOwnerRequest';
import type { GetVideoRequest as _src_video_v1_GetVideoRequest, GetVideoRequest__Output as _src_video_v1_GetVideoRequest__Output } from '../../../src/video/v1/GetVideoRequest';
import type { GetVideoResponse as _src_video_v1_GetVideoResponse, GetVideoResponse__Output as _src_video_v1_GetVideoResponse__Output } from '../../../src/video/v1/GetVideoResponse';
import type { GetVideosRequest as _src_video_v1_GetVideosRequest, GetVideosRequest__Output as _src_video_v1_GetVideosRequest__Output } from '../../../src/video/v1/GetVideosRequest';
import type { GetVideosResponse as _src_video_v1_GetVideosResponse, GetVideosResponse__Output as _src_video_v1_GetVideosResponse__Output } from '../../../src/video/v1/GetVideosResponse';
import type { ListVideosByOwnerRequest as _src_video_v1_ListVideosByOwnerRequest, ListVideosByOwnerRequest__Output as _src_video_v1_ListVideosByOwnerRequest__Output } from '../../../src/video/v1/ListVideosByOwnerRequest';
import type { StartVideoStreamRequest as _src_video_v1_StartVideoStreamRequest, StartVideoStreamRequest__Output as _src_video_v1_StartVideoStreamRequest__Output } from '../../../src/video/v1/StartVideoStreamRequest';
import type { StartVideoStreamResponse as _src_video_v1_StartVideoStreamResponse, StartVideoStreamResponse__Output as _src_video_v1_StartVideoStreamResponse__Output } from '../../../src/video/v1/StartVideoStreamResponse';
import type { StopUploadStreamRequest as _src_video_v1_StopUploadStreamRequest, StopUploadStreamRequest__Output as _src_video_v1_StopUploadStreamRequest__Output } from '../../../src/video/v1/StopUploadStreamRequest';
import type { StopUploadStreamResponse as _src_video_v1_StopUploadStreamResponse, StopUploadStreamResponse__Output as _src_video_v1_StopUploadStreamResponse__Output } from '../../../src/video/v1/StopUploadStreamResponse';
import type { UpdateVideoStreamingStateRequest as _src_video_v1_UpdateVideoStreamingStateRequest, UpdateVideoStreamingStateRequest__Output as _src_video_v1_UpdateVideoStreamingStateRequest__Output } from '../../../src/video/v1/UpdateVideoStreamingStateRequest';
import type { UpdateVideoStreamingStateResponse as _src_video_v1_UpdateVideoStreamingStateResponse, UpdateVideoStreamingStateResponse__Output as _src_video_v1_UpdateVideoStreamingStateResponse__Output } from '../../../src/video/v1/UpdateVideoStreamingStateResponse';

export interface DbComServiceClient extends grpc.Client {
  CreateUser(argument: _src_video_v1_CreateUserRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_CreateUserResponse__Output>): grpc.ClientUnaryCall;
  CreateUser(argument: _src_video_v1_CreateUserRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_CreateUserResponse__Output>): grpc.ClientUnaryCall;
  CreateUser(argument: _src_video_v1_CreateUserRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_CreateUserResponse__Output>): grpc.ClientUnaryCall;
  CreateUser(argument: _src_video_v1_CreateUserRequest, callback: grpc.requestCallback<_src_video_v1_CreateUserResponse__Output>): grpc.ClientUnaryCall;
  createUser(argument: _src_video_v1_CreateUserRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_CreateUserResponse__Output>): grpc.ClientUnaryCall;
  createUser(argument: _src_video_v1_CreateUserRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_CreateUserResponse__Output>): grpc.ClientUnaryCall;
  createUser(argument: _src_video_v1_CreateUserRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_CreateUserResponse__Output>): grpc.ClientUnaryCall;
  createUser(argument: _src_video_v1_CreateUserRequest, callback: grpc.requestCallback<_src_video_v1_CreateUserResponse__Output>): grpc.ClientUnaryCall;
  
  CreateVideo(argument: _src_video_v1_CreateVideoRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_CreateVideoResponse__Output>): grpc.ClientUnaryCall;
  CreateVideo(argument: _src_video_v1_CreateVideoRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_CreateVideoResponse__Output>): grpc.ClientUnaryCall;
  CreateVideo(argument: _src_video_v1_CreateVideoRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_CreateVideoResponse__Output>): grpc.ClientUnaryCall;
  CreateVideo(argument: _src_video_v1_CreateVideoRequest, callback: grpc.requestCallback<_src_video_v1_CreateVideoResponse__Output>): grpc.ClientUnaryCall;
  createVideo(argument: _src_video_v1_CreateVideoRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_CreateVideoResponse__Output>): grpc.ClientUnaryCall;
  createVideo(argument: _src_video_v1_CreateVideoRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_CreateVideoResponse__Output>): grpc.ClientUnaryCall;
  createVideo(argument: _src_video_v1_CreateVideoRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_CreateVideoResponse__Output>): grpc.ClientUnaryCall;
  createVideo(argument: _src_video_v1_CreateVideoRequest, callback: grpc.requestCallback<_src_video_v1_CreateVideoResponse__Output>): grpc.ClientUnaryCall;
  
  GetUserById(argument: _src_video_v1_GetUserByIdRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetUserResponse__Output>): grpc.ClientUnaryCall;
  GetUserById(argument: _src_video_v1_GetUserByIdRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_GetUserResponse__Output>): grpc.ClientUnaryCall;
  GetUserById(argument: _src_video_v1_GetUserByIdRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetUserResponse__Output>): grpc.ClientUnaryCall;
  GetUserById(argument: _src_video_v1_GetUserByIdRequest, callback: grpc.requestCallback<_src_video_v1_GetUserResponse__Output>): grpc.ClientUnaryCall;
  getUserById(argument: _src_video_v1_GetUserByIdRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetUserResponse__Output>): grpc.ClientUnaryCall;
  getUserById(argument: _src_video_v1_GetUserByIdRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_GetUserResponse__Output>): grpc.ClientUnaryCall;
  getUserById(argument: _src_video_v1_GetUserByIdRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetUserResponse__Output>): grpc.ClientUnaryCall;
  getUserById(argument: _src_video_v1_GetUserByIdRequest, callback: grpc.requestCallback<_src_video_v1_GetUserResponse__Output>): grpc.ClientUnaryCall;
  
  GetUserByUsername(argument: _src_video_v1_GetUserByUsernameRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetUserResponse__Output>): grpc.ClientUnaryCall;
  GetUserByUsername(argument: _src_video_v1_GetUserByUsernameRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_GetUserResponse__Output>): grpc.ClientUnaryCall;
  GetUserByUsername(argument: _src_video_v1_GetUserByUsernameRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetUserResponse__Output>): grpc.ClientUnaryCall;
  GetUserByUsername(argument: _src_video_v1_GetUserByUsernameRequest, callback: grpc.requestCallback<_src_video_v1_GetUserResponse__Output>): grpc.ClientUnaryCall;
  getUserByUsername(argument: _src_video_v1_GetUserByUsernameRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetUserResponse__Output>): grpc.ClientUnaryCall;
  getUserByUsername(argument: _src_video_v1_GetUserByUsernameRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_GetUserResponse__Output>): grpc.ClientUnaryCall;
  getUserByUsername(argument: _src_video_v1_GetUserByUsernameRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetUserResponse__Output>): grpc.ClientUnaryCall;
  getUserByUsername(argument: _src_video_v1_GetUserByUsernameRequest, callback: grpc.requestCallback<_src_video_v1_GetUserResponse__Output>): grpc.ClientUnaryCall;
  
  GetVideo(argument: _src_video_v1_GetVideoRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetVideoResponse__Output>): grpc.ClientUnaryCall;
  GetVideo(argument: _src_video_v1_GetVideoRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_GetVideoResponse__Output>): grpc.ClientUnaryCall;
  GetVideo(argument: _src_video_v1_GetVideoRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetVideoResponse__Output>): grpc.ClientUnaryCall;
  GetVideo(argument: _src_video_v1_GetVideoRequest, callback: grpc.requestCallback<_src_video_v1_GetVideoResponse__Output>): grpc.ClientUnaryCall;
  getVideo(argument: _src_video_v1_GetVideoRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetVideoResponse__Output>): grpc.ClientUnaryCall;
  getVideo(argument: _src_video_v1_GetVideoRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_GetVideoResponse__Output>): grpc.ClientUnaryCall;
  getVideo(argument: _src_video_v1_GetVideoRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetVideoResponse__Output>): grpc.ClientUnaryCall;
  getVideo(argument: _src_video_v1_GetVideoRequest, callback: grpc.requestCallback<_src_video_v1_GetVideoResponse__Output>): grpc.ClientUnaryCall;
  
  GetVideoForOwner(argument: _src_video_v1_GetVideoForOwnerRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetVideoResponse__Output>): grpc.ClientUnaryCall;
  GetVideoForOwner(argument: _src_video_v1_GetVideoForOwnerRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_GetVideoResponse__Output>): grpc.ClientUnaryCall;
  GetVideoForOwner(argument: _src_video_v1_GetVideoForOwnerRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetVideoResponse__Output>): grpc.ClientUnaryCall;
  GetVideoForOwner(argument: _src_video_v1_GetVideoForOwnerRequest, callback: grpc.requestCallback<_src_video_v1_GetVideoResponse__Output>): grpc.ClientUnaryCall;
  getVideoForOwner(argument: _src_video_v1_GetVideoForOwnerRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetVideoResponse__Output>): grpc.ClientUnaryCall;
  getVideoForOwner(argument: _src_video_v1_GetVideoForOwnerRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_GetVideoResponse__Output>): grpc.ClientUnaryCall;
  getVideoForOwner(argument: _src_video_v1_GetVideoForOwnerRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetVideoResponse__Output>): grpc.ClientUnaryCall;
  getVideoForOwner(argument: _src_video_v1_GetVideoForOwnerRequest, callback: grpc.requestCallback<_src_video_v1_GetVideoResponse__Output>): grpc.ClientUnaryCall;
  
  GetVideos(argument: _src_video_v1_GetVideosRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetVideosResponse__Output>): grpc.ClientUnaryCall;
  GetVideos(argument: _src_video_v1_GetVideosRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_GetVideosResponse__Output>): grpc.ClientUnaryCall;
  GetVideos(argument: _src_video_v1_GetVideosRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetVideosResponse__Output>): grpc.ClientUnaryCall;
  GetVideos(argument: _src_video_v1_GetVideosRequest, callback: grpc.requestCallback<_src_video_v1_GetVideosResponse__Output>): grpc.ClientUnaryCall;
  getVideos(argument: _src_video_v1_GetVideosRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetVideosResponse__Output>): grpc.ClientUnaryCall;
  getVideos(argument: _src_video_v1_GetVideosRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_GetVideosResponse__Output>): grpc.ClientUnaryCall;
  getVideos(argument: _src_video_v1_GetVideosRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetVideosResponse__Output>): grpc.ClientUnaryCall;
  getVideos(argument: _src_video_v1_GetVideosRequest, callback: grpc.requestCallback<_src_video_v1_GetVideosResponse__Output>): grpc.ClientUnaryCall;
  
  ListVideosByOwner(argument: _src_video_v1_ListVideosByOwnerRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetVideosResponse__Output>): grpc.ClientUnaryCall;
  ListVideosByOwner(argument: _src_video_v1_ListVideosByOwnerRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_GetVideosResponse__Output>): grpc.ClientUnaryCall;
  ListVideosByOwner(argument: _src_video_v1_ListVideosByOwnerRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetVideosResponse__Output>): grpc.ClientUnaryCall;
  ListVideosByOwner(argument: _src_video_v1_ListVideosByOwnerRequest, callback: grpc.requestCallback<_src_video_v1_GetVideosResponse__Output>): grpc.ClientUnaryCall;
  listVideosByOwner(argument: _src_video_v1_ListVideosByOwnerRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetVideosResponse__Output>): grpc.ClientUnaryCall;
  listVideosByOwner(argument: _src_video_v1_ListVideosByOwnerRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_GetVideosResponse__Output>): grpc.ClientUnaryCall;
  listVideosByOwner(argument: _src_video_v1_ListVideosByOwnerRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_GetVideosResponse__Output>): grpc.ClientUnaryCall;
  listVideosByOwner(argument: _src_video_v1_ListVideosByOwnerRequest, callback: grpc.requestCallback<_src_video_v1_GetVideosResponse__Output>): grpc.ClientUnaryCall;
  
  StartVideoStream(argument: _src_video_v1_StartVideoStreamRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_StartVideoStreamResponse__Output>): grpc.ClientUnaryCall;
  StartVideoStream(argument: _src_video_v1_StartVideoStreamRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_StartVideoStreamResponse__Output>): grpc.ClientUnaryCall;
  StartVideoStream(argument: _src_video_v1_StartVideoStreamRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_StartVideoStreamResponse__Output>): grpc.ClientUnaryCall;
  StartVideoStream(argument: _src_video_v1_StartVideoStreamRequest, callback: grpc.requestCallback<_src_video_v1_StartVideoStreamResponse__Output>): grpc.ClientUnaryCall;
  startVideoStream(argument: _src_video_v1_StartVideoStreamRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_StartVideoStreamResponse__Output>): grpc.ClientUnaryCall;
  startVideoStream(argument: _src_video_v1_StartVideoStreamRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_StartVideoStreamResponse__Output>): grpc.ClientUnaryCall;
  startVideoStream(argument: _src_video_v1_StartVideoStreamRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_StartVideoStreamResponse__Output>): grpc.ClientUnaryCall;
  startVideoStream(argument: _src_video_v1_StartVideoStreamRequest, callback: grpc.requestCallback<_src_video_v1_StartVideoStreamResponse__Output>): grpc.ClientUnaryCall;
  
  StopUploadStream(argument: _src_video_v1_StopUploadStreamRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_StopUploadStreamResponse__Output>): grpc.ClientUnaryCall;
  StopUploadStream(argument: _src_video_v1_StopUploadStreamRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_StopUploadStreamResponse__Output>): grpc.ClientUnaryCall;
  StopUploadStream(argument: _src_video_v1_StopUploadStreamRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_StopUploadStreamResponse__Output>): grpc.ClientUnaryCall;
  StopUploadStream(argument: _src_video_v1_StopUploadStreamRequest, callback: grpc.requestCallback<_src_video_v1_StopUploadStreamResponse__Output>): grpc.ClientUnaryCall;
  stopUploadStream(argument: _src_video_v1_StopUploadStreamRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_StopUploadStreamResponse__Output>): grpc.ClientUnaryCall;
  stopUploadStream(argument: _src_video_v1_StopUploadStreamRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_StopUploadStreamResponse__Output>): grpc.ClientUnaryCall;
  stopUploadStream(argument: _src_video_v1_StopUploadStreamRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_StopUploadStreamResponse__Output>): grpc.ClientUnaryCall;
  stopUploadStream(argument: _src_video_v1_StopUploadStreamRequest, callback: grpc.requestCallback<_src_video_v1_StopUploadStreamResponse__Output>): grpc.ClientUnaryCall;
  
  UpdateVideoStreamingState(argument: _src_video_v1_UpdateVideoStreamingStateRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_UpdateVideoStreamingStateResponse__Output>): grpc.ClientUnaryCall;
  UpdateVideoStreamingState(argument: _src_video_v1_UpdateVideoStreamingStateRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_UpdateVideoStreamingStateResponse__Output>): grpc.ClientUnaryCall;
  UpdateVideoStreamingState(argument: _src_video_v1_UpdateVideoStreamingStateRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_UpdateVideoStreamingStateResponse__Output>): grpc.ClientUnaryCall;
  UpdateVideoStreamingState(argument: _src_video_v1_UpdateVideoStreamingStateRequest, callback: grpc.requestCallback<_src_video_v1_UpdateVideoStreamingStateResponse__Output>): grpc.ClientUnaryCall;
  updateVideoStreamingState(argument: _src_video_v1_UpdateVideoStreamingStateRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_UpdateVideoStreamingStateResponse__Output>): grpc.ClientUnaryCall;
  updateVideoStreamingState(argument: _src_video_v1_UpdateVideoStreamingStateRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_src_video_v1_UpdateVideoStreamingStateResponse__Output>): grpc.ClientUnaryCall;
  updateVideoStreamingState(argument: _src_video_v1_UpdateVideoStreamingStateRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_src_video_v1_UpdateVideoStreamingStateResponse__Output>): grpc.ClientUnaryCall;
  updateVideoStreamingState(argument: _src_video_v1_UpdateVideoStreamingStateRequest, callback: grpc.requestCallback<_src_video_v1_UpdateVideoStreamingStateResponse__Output>): grpc.ClientUnaryCall;
  
}

export interface DbComServiceHandlers extends grpc.UntypedServiceImplementation {
  CreateUser: grpc.handleUnaryCall<_src_video_v1_CreateUserRequest__Output, _src_video_v1_CreateUserResponse>;
  
  CreateVideo: grpc.handleUnaryCall<_src_video_v1_CreateVideoRequest__Output, _src_video_v1_CreateVideoResponse>;
  
  GetUserById: grpc.handleUnaryCall<_src_video_v1_GetUserByIdRequest__Output, _src_video_v1_GetUserResponse>;
  
  GetUserByUsername: grpc.handleUnaryCall<_src_video_v1_GetUserByUsernameRequest__Output, _src_video_v1_GetUserResponse>;
  
  GetVideo: grpc.handleUnaryCall<_src_video_v1_GetVideoRequest__Output, _src_video_v1_GetVideoResponse>;
  
  GetVideoForOwner: grpc.handleUnaryCall<_src_video_v1_GetVideoForOwnerRequest__Output, _src_video_v1_GetVideoResponse>;
  
  GetVideos: grpc.handleUnaryCall<_src_video_v1_GetVideosRequest__Output, _src_video_v1_GetVideosResponse>;
  
  ListVideosByOwner: grpc.handleUnaryCall<_src_video_v1_ListVideosByOwnerRequest__Output, _src_video_v1_GetVideosResponse>;
  
  StartVideoStream: grpc.handleUnaryCall<_src_video_v1_StartVideoStreamRequest__Output, _src_video_v1_StartVideoStreamResponse>;
  
  StopUploadStream: grpc.handleUnaryCall<_src_video_v1_StopUploadStreamRequest__Output, _src_video_v1_StopUploadStreamResponse>;
  
  UpdateVideoStreamingState: grpc.handleUnaryCall<_src_video_v1_UpdateVideoStreamingStateRequest__Output, _src_video_v1_UpdateVideoStreamingStateResponse>;
  
}

export interface DbComServiceDefinition extends grpc.ServiceDefinition {
  CreateUser: MethodDefinition<_src_video_v1_CreateUserRequest, _src_video_v1_CreateUserResponse, _src_video_v1_CreateUserRequest__Output, _src_video_v1_CreateUserResponse__Output>
  CreateVideo: MethodDefinition<_src_video_v1_CreateVideoRequest, _src_video_v1_CreateVideoResponse, _src_video_v1_CreateVideoRequest__Output, _src_video_v1_CreateVideoResponse__Output>
  GetUserById: MethodDefinition<_src_video_v1_GetUserByIdRequest, _src_video_v1_GetUserResponse, _src_video_v1_GetUserByIdRequest__Output, _src_video_v1_GetUserResponse__Output>
  GetUserByUsername: MethodDefinition<_src_video_v1_GetUserByUsernameRequest, _src_video_v1_GetUserResponse, _src_video_v1_GetUserByUsernameRequest__Output, _src_video_v1_GetUserResponse__Output>
  GetVideo: MethodDefinition<_src_video_v1_GetVideoRequest, _src_video_v1_GetVideoResponse, _src_video_v1_GetVideoRequest__Output, _src_video_v1_GetVideoResponse__Output>
  GetVideoForOwner: MethodDefinition<_src_video_v1_GetVideoForOwnerRequest, _src_video_v1_GetVideoResponse, _src_video_v1_GetVideoForOwnerRequest__Output, _src_video_v1_GetVideoResponse__Output>
  GetVideos: MethodDefinition<_src_video_v1_GetVideosRequest, _src_video_v1_GetVideosResponse, _src_video_v1_GetVideosRequest__Output, _src_video_v1_GetVideosResponse__Output>
  ListVideosByOwner: MethodDefinition<_src_video_v1_ListVideosByOwnerRequest, _src_video_v1_GetVideosResponse, _src_video_v1_ListVideosByOwnerRequest__Output, _src_video_v1_GetVideosResponse__Output>
  StartVideoStream: MethodDefinition<_src_video_v1_StartVideoStreamRequest, _src_video_v1_StartVideoStreamResponse, _src_video_v1_StartVideoStreamRequest__Output, _src_video_v1_StartVideoStreamResponse__Output>
  StopUploadStream: MethodDefinition<_src_video_v1_StopUploadStreamRequest, _src_video_v1_StopUploadStreamResponse, _src_video_v1_StopUploadStreamRequest__Output, _src_video_v1_StopUploadStreamResponse__Output>
  UpdateVideoStreamingState: MethodDefinition<_src_video_v1_UpdateVideoStreamingStateRequest, _src_video_v1_UpdateVideoStreamingStateResponse, _src_video_v1_UpdateVideoStreamingStateRequest__Output, _src_video_v1_UpdateVideoStreamingStateResponse__Output>
}
