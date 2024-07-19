/*
  Warnings:

  - You are about to drop the column `buff` on the `Association` table. All the data in the column will be lost.
  - You are about to drop the column `nerf` on the `Association` table. All the data in the column will be lost.
  - Added the required column `classifier` to the `Association` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keyword` to the `Association` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Association` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Association" DROP COLUMN "buff",
DROP COLUMN "nerf",
ADD COLUMN     "classifier" TEXT NOT NULL,
ADD COLUMN     "keyword" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;
