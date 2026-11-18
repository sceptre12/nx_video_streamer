import {VIDEO_PROTO_PATH} from '@globals/constants';
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from '@grpc/proto-loader'
import { GRPC_PORT } from '@globals/constants';
import type {ProtoGrpcType} from '@generated/protobuf-types';

// Contract runtime-env-ports: DB_GRPC_ADDR, default localhost:50051 (db-server:50051 in containers).
const DB_GRPC_ADDR = process.env.DB_GRPC_ADDR || `localhost:${GRPC_PORT}`;

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

  return new VIDEO_PROTO.src.video.v1.DbComService(DB_GRPC_ADDR, grpc.credentials.createInsecure());
}

const videoGrpcClient = createGrpcClient();

console.log("\nGrpc client created\n");

export default videoGrpcClient;