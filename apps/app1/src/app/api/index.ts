
interface ApiResponse<T>{
  error: null | Error;
  data: T | undefined
}

interface CreateVideoParams {
  video_id: string;
  start_time: number;
}

const API_VERSION = 'v1';

export interface VideoItem {
  video_id: string;
  start_time: number;
  is_streaming: boolean;
  thumbnail_path: string;
  video_path: string;
}

export interface AuthUser {
  version: string;
  user_id: string;
  username: string;
}

export interface LibraryVideo {
  video_id: string;
  title: string;
  duration_s: number;
  thumbnail_url: string | null;
  stream_url: string;
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Calls a relative /api/v1 route with the session cookie and keeps the
 * contract error shape ({version, error: {code, message}}) on failure.
 */
const request = async <T>(path: string, init: RequestInit = {}): Promise<T | undefined> => {
  const response = await fetch(`/api/${API_VERSION}${path}`, { ...init, credentials: 'include' });
  if (!response.ok) {
    let code = 'unknown_error';
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) {
        code = body.error.code ?? code;
        message = body.error.message ?? message;
      }
    } catch {
      // non-JSON error body: keep the defaults
    }
    throw new ApiError(response.status, code, message);
  }
  if (response.status === 204) return undefined;
  return (await response.json()) as T;
};

const wrap = async <T>(call: () => Promise<T | undefined>): Promise<ApiResponse<T>> => {
  try {
    return { error: null, data: await call() };
  } catch (error) {
    return { error: error as Error, data: undefined };
  }
};

export const login = ({ username, password }: { username: string; password: string }) =>
  wrap(() =>
    request<AuthUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: { 'Content-Type': 'application/json' },
    })
  );

export const logout = () =>
  wrap(async () => {
    await request<void>('/auth/logout', { method: 'POST' });
    return true;
  });

export const getMe = () => wrap(() => request<AuthUser>('/auth/me'));

export const getLibrary = () =>
  wrap(async () => (await request<{ version: string; videos: LibraryVideo[] }>('/library'))?.videos);

const jsonHeaders = { 'Content-Type': 'application/json' };

export const createVideo = ({ video_id, start_time }: CreateVideoParams) =>
  wrap(() =>
    request<VideoItem>('/video/create', {
      method: 'POST',
      body: JSON.stringify({ video_id, start_time }),
      headers: jsonHeaders,
    })
  );

export const toggleStreamingState = ({ video_id, has_started }: { video_id: string; has_started: boolean }) =>
  wrap(async () => {
    const result = await request<{ success: boolean }>(`/video/${video_id}`, {
      method: 'POST',
      body: JSON.stringify({ has_streaming_started: has_started }),
      headers: jsonHeaders,
    });
    if (!result) throw new Error('Server did not return any result');
    return result.success;
  });
