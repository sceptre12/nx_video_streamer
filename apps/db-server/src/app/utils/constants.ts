import path from 'path';

// Contract runtime-env-ports: VIDEO_STORAGE_DIR default /data/videos.
const VIDEO_STORAGE_DIR = path.resolve(process.env.VIDEO_STORAGE_DIR || '/data/videos');

// Kept as an alias of the resolved VIDEO_STORAGE_DIR so video_processor still compiles until it switches its import.
const STORAGE_PATH = VIDEO_STORAGE_DIR;

// Contract grpc-db: video_id pattern.
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export {
  STORAGE_PATH,
  VIDEO_STORAGE_DIR,
  VIDEO_ID_PATTERN
}
