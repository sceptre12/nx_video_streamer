'use strict';
/*
 * Demo seed (plain node, no TypeScript runner).
 * Creates accounts demo1 and demo2 (passwords from DEMO_USER1_PASSWORD and
 * DEMO_USER2_PASSWORD), generates sample VP9 MP4s plus JPEG thumbnails with
 * ffmpeg under VIDEO_STORAGE_DIR and inserts Video rows. Safe to run twice.
 * Prints account names only, never a password.
 */
const { execFileSync } = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const BCRYPT_COST = 10;
const VIDEOS_PER_USER = 2;
const DURATION_S = 2;

const ACCOUNTS = [
  { username: 'demo1', passwordEnv: 'DEMO_USER1_PASSWORD' },
  { username: 'demo2', passwordEnv: 'DEMO_USER2_PASSWORD' },
];

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`seed: missing required environment variable ${name}`);
    process.exit(1);
  }
  return v;
}

function ffmpeg(args) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });
}

function makeVideo(abs, thumbAbs, n) {
  mkdirSync(path.dirname(abs), { recursive: true });
  const src = `testsrc=duration=${DURATION_S}:size=320x240:rate=15`;
  ffmpeg([
    '-f', 'lavfi', '-i', src,
    '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p', '-an',
    '-movflags', '+faststart', abs,
  ]);
  ffmpeg(['-i', abs, '-frames:v', '1', thumbAbs]);
}

async function main() {
  const storage = requireEnv('VIDEO_STORAGE_DIR');
  requireEnv('DATABASE_URL');
  const passwords = ACCOUNTS.map((a) => requireEnv(a.passwordEnv));

  const prisma = new PrismaClient();
  try {
    for (let i = 0; i < ACCOUNTS.length; i++) {
      const { username } = ACCOUNTS[i];
      const password_hash = await bcrypt.hash(passwords[i], BCRYPT_COST);
      const user = await prisma.user.upsert({
        where: { username },
        update: { password_hash },
        create: { username, password_hash, created_at: BigInt(Date.now()) },
      });
      console.log(`seed: account ${username} ready`);

      for (let n = 1; n <= VIDEOS_PER_USER; n++) {
        const video_id = `${username}-sample-${n}`;
        const video_path = `${username}/sample-${n}.mp4`;
        const thumbnail_path = `${username}/sample-${n}.jpg`;
        const abs = path.join(storage, video_path);
        const thumbAbs = path.join(storage, thumbnail_path);

        const existing = await prisma.video.findUnique({ where: { video_id } });
        if (!existing || !existsSync(abs) || !existsSync(thumbAbs)) {
          makeVideo(abs, thumbAbs, n);
        }
        if (existing) {
          console.log(`seed: video ${video_id} already present, skipped`);
          continue;
        }
        const now = BigInt(Date.now());
        await prisma.video.create({
          data: {
            video_id,
            start_time: now,
            end_time: now + BigInt(DURATION_S * 1000),
            is_streaming: false,
            video_path,
            thumbnail_path,
            owner_id: user.user_id,
            title: `${username} sample ${n}`,
            duration_s: DURATION_S,
          },
        });
        console.log(`seed: video ${video_id} created`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('seed: failed:', e && e.message ? e.message : e);
  process.exit(1);
});
