import type { VideoRecord } from '../../../../grpc/casing';

export interface LibraryVideo {
  video_id: string;
  title: string | null;
  duration_s: number | null;
  thumbnail_url: null;
  stream_url: string;
}

/** contracts/api-http.md: stream_url is the relative stream path; thumbnail_url is null in this epic. */
export const toLibraryVideo = (v: VideoRecord): LibraryVideo => ({
  video_id: v.video_id,
  title: v.title ?? null,
  duration_s: v.duration_s ?? null,
  thumbnail_url: null,
  stream_url: `/api/v1/videos/${v.video_id}/stream`,
});
