import {VIDEO_PROTO_PATH} from '@globals/constants';
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from '@grpc/proto-loader'
import { GRPC_PORT } from '@globals/constants';
import type {ProtoGrpcType} from '@generated/protobuf-types';
import { existsSync } from 'fs';
import { dirname, isAbsolute, join, resolve } from 'path';

// VIDEO_PROTO_PATH is relative to the repo root. When it does not exist from cwd (e.g. jest run from
// apps/app-server), resolve it against the nearest ancestor holding nx.json. From the repo root, unchanged.
const resolveProtoPath = (p: string): string => {
  if (isAbsolute(p) || existsSync(p)) return p;
  for (let dir = resolve(process.cwd()); ; dir = dirname(dir)) {
    if (existsSync(join(dir, 'nx.json')) && existsSync(join(dir, p))) return join(dir, p);
    if (dirname(dir) === dir) return p;
  }
};

// Contract runtime-env-ports names DB_GRPC_ADDR (db-server:50051 in containers); the localhost:50051 default is this unit's (u5) local-run default.
const DB_GRPC_ADDR = process.env.DB_GRPC_ADDR || `localhost:${GRPC_PORT}`;

const createGrpcClient = () => {
  console.log("Setting up Grpc Client");

  const packageDefinition = protoLoader.loadSync(resolveProtoPath(VIDEO_PROTO_PATH), {
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