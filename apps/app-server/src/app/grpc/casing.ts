/**
 * The one place where the two field casings meet.
 *
 * The loader runs with `keepCase: true`, so request and response objects at runtime are snake_case.
 * The generated types under protos/libs/gen/protobuf-types are camelCase. Wrappers keep a snake_case
 * public shape; the only cast to the generated types is `toWire`. The casing mapping (`toWire` and the
 * `from*` mappers below) lives here; services/createVideo.ts (`results`), services/updateVideoStreamingState.ts
 * (`update_complete`) and services/users.ts (`user`) also make thin pass-through reads of one top-level
 * response field before handing it on. The `casing:` cases in
 * services/users-videos-client.spec.ts assert this against the built db-server.
 */

export interface UserRecord {
  user_id: string;
  username: string;
  password_hash: string;
  /** int64 arrives as a string (loader option `longs: String`) */
  created_at: string;
}

export interface VideoRecord {
  video_id: string;
  start_time: number;
  end_time?: number | null;
  is_streaming: boolean;
  thumbnail_path?: string | null;
  video_path?: string | null;
  owner_id?: string | null;
  title?: string | null;
  duration_s?: number | null;
}

type Raw = Record<string, unknown>;

/** Types a snake_case runtime request as the generated (camelCase) request type the client expects. */
export const toWire = <T>(request: object): T => request as unknown as T;

export const fromUser = (raw: unknown): UserRecord | null => {
  if (!raw) return null;
  const r = raw as Raw;
  return {
    user_id: r['user_id'] as string,
    username: r['username'] as string,
    password_hash: r['password_hash'] as string,
    created_at: String(r['created_at']),
  };
};

export const fromVideo = (raw: unknown): VideoRecord => {
  const r = (raw ?? {}) as Raw;
  return {
    video_id: r['video_id'] as string,
    start_time: r['start_time'] as number,
    end_time: r['end_time'] as number | null | undefined,
    is_streaming: r['is_streaming'] as boolean,
    thumbnail_path: r['thumbnail_path'] as string | null | undefined,
    video_path: r['video_path'] as string | null | undefined,
    owner_id: r['owner_id'] as string | null | undefined,
    title: r['title'] as string | null | undefined,
    duration_s: r['duration_s'] as number | null | undefined,
  };
};

export const fromVideoList = (raw: unknown): VideoRecord[] => {
  const results = ((raw ?? {}) as Raw)['results'];
  return Array.isArray(results) ? results.map(fromVideo) : [];
};
