/**
 * Resolves a stored `video_path` (relative to VIDEO_STORAGE_DIR, contracts/db-schema.md) to a file
 * inside the volume. Null when the path is missing, absolute, escapes the volume (also through a
 * symlink) or does not name a regular file: the route answers 404 and reads nothing.
 */
import { realpath, stat } from 'fs/promises';
import type { Stats } from 'fs';
import { isAbsolute, relative, resolve, sep } from 'path';

/** contracts/runtime-env-ports.md: default `/data/videos`; read per request so a spec can point it elsewhere. */
export const videoStorageDir = (): string => resolve(process.env.VIDEO_STORAGE_DIR || '/data/videos');

const isInside = (root: string, candidate: string): boolean => {
  const rel = relative(root, candidate);
  return rel !== '' && !rel.startsWith('..' + sep) && rel !== '..' && !isAbsolute(rel);
};

export interface VideoFile {
  path: string;
  stats: Stats;
}

export async function resolveVideoFile(videoPath: string | null | undefined, root = videoStorageDir()): Promise<VideoFile | null> {
  if (!videoPath || isAbsolute(videoPath)) return null;
  const joined = resolve(root, videoPath);
  if (!isInside(root, joined)) return null;
  try {
    const [realRoot, realFile] = await Promise.all([realpath(root), realpath(joined)]);
    if (!isInside(realRoot, realFile)) return null;
    const stats = await stat(realFile);
    return stats.isFile() ? { path: realFile, stats } : null;
  } catch {
    return null;
  }
}
