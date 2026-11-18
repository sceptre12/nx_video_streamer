import videoGrpcClient from '../index';
import { fromUser, toWire, UserRecord } from '../casing';
import { callUnary, UnaryParams } from './callUnary';
import type { CreateUserRequest } from 'protos/libs/gen/protobuf-types/src/video/v1/CreateUserRequest';
import type { GetUserByUsernameRequest } from 'protos/libs/gen/protobuf-types/src/video/v1/GetUserByUsernameRequest';
import type { GetUserByIdRequest } from 'protos/libs/gen/protobuf-types/src/video/v1/GetUserByIdRequest';

const userOf = (raw: unknown) => fromUser((raw as { user?: unknown } | null)?.user);

/** CreateUser: ALREADY_EXISTS (HTTP 409 code to the error handler) when the username exists. */
export const createUser = (p: UnaryParams<{ username: string; password_hash: string }, UserRecord | null>) =>
  callUnary((req, cb) => videoGrpcClient.CreateUser(toWire<CreateUserRequest>(req), cb), userOf, p);

/** GetUserByUsername: result is null when the user does not exist. */
export const getUserByUsername = (p: UnaryParams<{ username: string }, UserRecord | null>) =>
  callUnary((req, cb) => videoGrpcClient.GetUserByUsername(toWire<GetUserByUsernameRequest>(req), cb), userOf, p);

/** GetUserById: result is null when the user does not exist. */
export const getUserById = (p: UnaryParams<{ user_id: string }, UserRecord | null>) =>
  callUnary((req, cb) => videoGrpcClient.GetUserById(toWire<GetUserByIdRequest>(req), cb), userOf, p);
