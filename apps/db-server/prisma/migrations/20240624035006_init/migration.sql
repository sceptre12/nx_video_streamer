-- CreateTable
CREATE TABLE "Video" (
    "video_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "is_streaming" BOOLEAN NOT NULL DEFAULT true,
    "thumbnail_path" TEXT,
    "video_path" TEXT,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("video_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Video_video_id_key" ON "Video"("video_id");

-- CreateIndex
CREATE UNIQUE INDEX "Video_thumbnail_path_key" ON "Video"("thumbnail_path");

-- CreateIndex
CREATE UNIQUE INDEX "Video_video_path_key" ON "Video"("video_path");
