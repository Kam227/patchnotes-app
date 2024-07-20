/*
  Warnings:

  - You are about to drop the column `patchId` on the `Ability` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Ability" DROP CONSTRAINT "Ability_patchId_fkey";

-- AlterTable
ALTER TABLE "Ability" DROP COLUMN "patchId",
ADD COLUMN     "patchIdLOL" INTEGER,
ADD COLUMN     "patchIdOW" INTEGER;

-- AddForeignKey
ALTER TABLE "Ability" ADD CONSTRAINT "Ability_patchIdOW_fkey" FOREIGN KEY ("patchIdOW") REFERENCES "Patchnotes_ow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability" ADD CONSTRAINT "Ability_patchIdLOL_fkey" FOREIGN KEY ("patchIdLOL") REFERENCES "Patchnotes_lol"("id") ON DELETE SET NULL ON UPDATE CASCADE;
