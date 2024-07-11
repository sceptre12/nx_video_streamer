import {VIDEO_PROTO_PATH} from '@globals/constants';
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from '@grpc/proto-loader'
import { GRPC_PORT } from '@globals/constants';
import type {ProtoGrpcType} from '@generated/protobuf-types';

import { handleCreatingVideoService } from './services/handleCreatingVideo';
import {handleUpdatingStreamingState} from './services/handleUpdatingStreamingState'


const launchGrpcServer = () => {
  console.log("Setting up Grpc Server");

  const packageDefinition = protoLoader.loadSync(VIDEO_PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    // Doing these based off example from 
    // https://grpc.io/docs/languages/node/quickstart/
    defaults: true,
    oneofs: true
  })

  const VIDEO_PROTO = (grpc.loadPackageDefinition(packageDefinition) as unknown) as ProtoGrpcType;

  const grpcServer = new grpc.Server();

  // Register Services
  grpcServer.addService(VIDEO_PROTO.src.video.v1.DbComService.service, {
    CreateVideo: handleCreatingVideoService,
    UpdateVideoStreamingState: handleUpdatingStreamingState
  });


  grpcServer.bindAsync(`0.0.0.0:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), () =>{
    grpcServer.start()
    console.log("Launched Grpc Server")
  })
}


launchGrpcServer();