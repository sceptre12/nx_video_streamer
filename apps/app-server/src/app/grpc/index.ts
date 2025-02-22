import {VIDEO_PROTO_PATH} from '@globals/constants';
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from '@grpc/proto-loader'
import { GRPC_PORT } from '@globals/constants';
import type {ProtoGrpcType} from '@generated/protobuf-types';


const createGrpcClient = () => {
  console.log("Setting up Grpc Client");

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

  return new VIDEO_PROTO.src.video.v1.DbComService(`localhost:${GRPC_PORT}`, grpc.credentials.createInsecure());
}

const videoGrpcClient = createGrpcClient();

console.log("\nGrpc client created\n");

export default videoGrpcClient;