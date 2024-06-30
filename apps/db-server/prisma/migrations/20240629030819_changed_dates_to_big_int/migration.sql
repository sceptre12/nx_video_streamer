/*
  Warnings:

  - The `end_time` column on the `Video` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `start_time` on the `Video` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Video" DROP COLUMN "start_time",
ADD COLUMN     "start_time" BIGINT NOT NULL,
DROP COLUMN "end_time",
ADD COLUMN     "end_time" BIGINT;
