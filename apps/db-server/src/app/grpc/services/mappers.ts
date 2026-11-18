import * as grpc from '@grpc/grpc-js';

/**
 * The loader runs with keepCase: true, so runtime objects are snake_case while the
 * generated TypeScript types are camelCase. These mappers build the snake_case runtime
 * objects and cast once, here.
 */

interface VideoRow {
  video_id: string;
  start_time: bigint;
  end_time: bigint | null;
  is_streaming: boolean;
  thumbnail_path: string | null;
  video_path: string | null;
  owner_id: string | null;
  title: string | null;
  duration_s: number | null;
}

interface UserRow {
  user_id: string;
  username: string;
  password_hash: string;
  created_at: bigint;
}

// BigInt -> Number for the int32 proto fields; null optional fields are omitted.
export const toVideoItem = (row: VideoRow) => {
  const item: Record<string, unknown> = {
    video_id: row.video_id,
    start_time: Number(row.start_time),
    is_streaming: row.is_streaming,
  };
  if (row.end_time !== null) item.end_time = Number(row.end_time);
  if (row.thumbnail_path !== null) item.thumbnail_path = row.thumbnail_path;
  if (row.video_path !== null) item.video_path = row.video_path;
  if (row.owner_id !== null) item.owner_id = row.owner_id;
  if (row.title !== null) item.title = row.title;
  if (row.duration_s !== null) item.duration_s = row.duration_s;
  return item;
}

// BigInt -> String for the int64 created_at (loader uses longs: String).
export const toUser = (row: UserRow) => ({
  user_id: row.user_id,
  username: row.username,
  password_hash: row.password_hash,
  created_at: String(row.created_at),
})

export class GrpcError extends Error {
  constructor(public code: grpc.status, message: string) {
    super(message);
  }
}

// Maps an error to a gRPC status; the handler replies with it and the server keeps running.
export const toServiceError = (e: unknown): grpc.ServiceError => {
  const err = e as { code?: unknown; message?: string };
  let code = grpc.status.INTERNAL;
  if (e instanceof GrpcError) code = e.code;
  else if (err && err.code === 'P2002') code = grpc.status.ALREADY_EXISTS;
  else if (err && err.code === 'P2003') code = grpc.status.INVALID_ARGUMENT;
  else if (err && err.code === 'P2025') code = grpc.status.NOT_FOUND;
  else console.error(e);
  return { code, details: err?.message ?? String(e), message: err?.message ?? String(e), metadata: new grpc.Metadata(), name: 'ServiceError' } as grpc.ServiceError;
}

// Wraps a handler body: a thrown error becomes a reply, never an uncaught throw.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const unary = (fn: (request: any) => Promise<unknown>) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async (call: any, callback: (err: grpc.ServiceError | null, value?: any) => void) => {
    try {
      callback(null, await fn(call.request));
    } catch (e) {
      callback(toServiceError(e));
    }
  }
