/*
  Warnings:

  - Added the required column `character` to the `Ability` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ability" ADD COLUMN     "character" TEXT NOT NULL;
