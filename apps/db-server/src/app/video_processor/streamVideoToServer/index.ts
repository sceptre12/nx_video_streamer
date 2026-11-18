import { createWriteStream, WriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { VIDEO_ID_PATTERN, VIDEO_STORAGE_DIR } from '../../utils/constants';
import { getVideoForOwner } from '../../db/video/read';

/**
 * Capture state is per socket: one CaptureSession lives on the socket's own `data`
 * (never in a module global), is created by initalizeStream and cleared on end and on disconnect.
 */
export interface CaptureSession {
  user_id: string;
  video_id: string;
  stream: WriteStream;
}

export class CaptureError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

/** Server-derived target: VIDEO_STORAGE_DIR/<video_id>/<video_id>.mp4 (the path CreateVideo records). */
export const resolveCapturePath = (video_id: string): string => {
  if (typeof video_id !== 'string' || !VIDEO_ID_PATTERN.test(video_id)) {
    throw new CaptureError('invalid_input', 'video_id must match ^[A-Za-z0-9_-]{1,64}$');
  }
  const target = path.resolve(VIDEO_STORAGE_DIR, video_id, `${video_id}.mp4`);
  if (!target.startsWith(VIDEO_STORAGE_DIR + path.sep)) {
    throw new CaptureError('invalid_input', 'path outside storage');
  }
  return target;
};

/** Owner check goes through the owner-filtered helper: a legacy owner_id NULL row never matches. */
export const openCaptureSession = async (user_id: string, video_id: string): Promise<CaptureSession> => {
  const target = resolveCapturePath(video_id);
  const row = await getVideoForOwner(video_id, user_id);
  if (!row) throw new CaptureError('not_found', 'video not found');
  await mkdir(path.dirname(target), { recursive: true });
  return { user_id, video_id, stream: createWriteStream(target) };
};

const toBuffer = (chunk: unknown): Buffer | null => {
  if (Buffer.isBuffer(chunk)) return chunk;
  if (chunk instanceof ArrayBuffer) return Buffer.from(chunk);
  if (ArrayBuffer.isView(chunk)) return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  return null;
};

export const writeCaptureChunk = (session: CaptureSession | undefined, chunk: unknown): boolean => {
  const buf = toBuffer(chunk);
  if (!session || !buf) return false;
  session.stream.write(buf);
  return true;
};

export const closeCaptureSession = (session: CaptureSession | undefined): Promise<void> =>
  new Promise((resolve) => {
    if (!session || session.stream.destroyed || session.stream.writableEnded) return resolve();
    session.stream.end(() => resolve());
  });
