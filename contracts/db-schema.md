owner: contracts/db-schema.md
consumers: db-users-videos-schema, db-server-grpc-users-videos, account-auth, seed-demo-accounts-and-videos
version: 1
status: proposed target shape; the current shape is `model Video` in apps/db-server/prisma/schema.prisma (measured, facts.md)

# Prisma target shape (PostgreSQL)
- New `model User`: `user_id String @id @default(uuid())`, `username String @unique`, `password_hash String` (a bcrypt-format hash produced with `bcryptjs`, cost 10, default and proposed; pure JavaScript so the slim image needs no native build; login verification and the seed use the same algorithm), `created_at BigInt`.
- `model Video` gains `owner_id String?` (relation to User.user_id, indexed), `title String?`, `duration_s Int?`. `owner_id` is nullable so the migration is additive (nullable columns only; there is no down migration, rollback = recreate the volume, which loses data and is for the local stack only); videos with no owner appear in no library and cannot be streamed.
- `video_path` holds a path relative to env `VIDEO_STORAGE_DIR` (never absolute). `thumbnail_path` likewise.
- The migration is a new directory under apps/db-server/prisma/migrations; the two existing migrations stay unchanged.
