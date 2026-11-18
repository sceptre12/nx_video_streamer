// Original file: src/video/v1/video.proto

import type { Long } from '@grpc/proto-loader';

export interface User {
  'userId'?: (string);
  'username'?: (string);
  'passwordHash'?: (string);
  'createdAt'?: (number | string | Long);
}

export interface User__Output {
  'userId': (string);
  'username': (string);
  'passwordHash': (string);
  'createdAt': (string);
}
