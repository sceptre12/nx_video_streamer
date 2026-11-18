import * as grpc from '@grpc/grpc-js'
import { createUser, getUserById, getUserByUsername } from '../../db/user/user'
import { getVideoForOwner, listVideosByOwner } from '../../db/video/read'
import { GrpcError, toUser, toVideoItem, unary } from './mappers'

export const handleCreateUser = unary(async ({username, password_hash}) => {
  if (!username || !password_hash) throw new GrpcError(grpc.status.INVALID_ARGUMENT, 'username and password_hash are required');
  // a duplicate username surfaces as Prisma P2002 -> ALREADY_EXISTS
  return {user: toUser(await createUser(username, password_hash))};
})

// Not found = the user field is unset, never an empty User.
export const handleGetUserByUsername = unary(async ({username}) => {
  const row = username ? await getUserByUsername(username) : null;
  return row ? {user: toUser(row)} : {};
})

export const handleGetUserById = unary(async ({user_id}) => {
  const row = user_id ? await getUserById(user_id) : null;
  return row ? {user: toUser(row)} : {};
})

export const handleListVideosByOwner = unary(async ({owner_id}) => {
  const rows = await listVideosByOwner(owner_id);
  return {results: rows.map(toVideoItem)};
})

export const handleGetVideoForOwner = unary(async ({video_id, owner_id}) => {
  const row = await getVideoForOwner(video_id, owner_id);
  if (!row) throw new GrpcError(grpc.status.NOT_FOUND, 'video not found');
  return toVideoItem(row);
})
