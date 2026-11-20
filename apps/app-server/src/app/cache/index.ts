import {
  LIBRARY_TTL_S,
  USER_TTL_S,
  closeClient,
  deleteKey,
  libraryKey,
  readJson,
  userKey,
  writeJson,
} from './redis-cache';

export { closeClient, libraryKey, userKey, LIBRARY_TTL_S, USER_TTL_S };

/** The cached `user:v1:{user_id}` value: never carries password_hash. */
export interface CachedUser {
  user_id: string;
  username: string;
}

/** lib:v1:{user_id}: the JSON body of GET /api/v1/library; null is a MISS (also on any Redis error). */
export const getLibrary = <T = unknown>(userId: string): Promise<T | null> => readJson<T>(libraryKey(userId));

export const setLibrary = (userId: string, body: unknown): Promise<void> =>
  writeJson(libraryKey(userId), body, LIBRARY_TTL_S);

/** user:v1:{user_id}; null is a MISS (also on any Redis error). */
export const getUser = (userId: string): Promise<CachedUser | null> => readJson<CachedUser>(userKey(userId));

/** Copies only user_id and username, so a full user row passed in never leaks password_hash into Redis. */
export const setUser = (userId: string, user: { user_id: string; username: string }): Promise<void> =>
  writeJson(userKey(userId), { user_id: user.user_id, username: user.username } satisfies CachedUser, USER_TTL_S);

/** Deletes lib:v1:{user_id} only. */
export const invalidateLibrary = (userId: string): Promise<void> => deleteKey(libraryKey(userId));
