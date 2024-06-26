import {VIDEO_PROTO_PATH} from '@globals/constants';
import grpc from "@grpc/grpc-js";
import protoLoader from '@grpc/proto-loader'
import type {ProtoGrpcType} from '@generated/protobuf-types';


export const launchGrpcClient = () =>{
  console.log("ProtoPath",VIDEO_PROTO_PATH);
  console.log("Setting up Grpc server");
  const packageDefinition = protoLoader.loadSync(VIDEO_PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    // Doing these based off example from 
    // https://grpc.io/docs/languages/node/quickstart/
    defaults: true,
    oneofs: true
  })

  const VIDEO_PROTO = grpc.loadPackageDefinition(packageDefinition);



}
