-- CreateTable
CREATE TABLE "User" (
    "user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "duration_s" INTEGER,
ADD COLUMN     "owner_id" TEXT,
ADD COLUMN     "title" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Video_owner_id_idx" ON "Video"("owner_id");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
