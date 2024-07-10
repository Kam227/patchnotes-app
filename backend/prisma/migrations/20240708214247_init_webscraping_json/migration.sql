/*
  Warnings:

  - You are about to drop the `Agent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Damage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OwBug` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OwMap` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Support` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tank` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ValBug` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ValMap` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `details` to the `Patchnotes_ow` table without a default value. This is not possible if the table is not empty.
  - Added the required column `details` to the `Patchnotes_val` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Agent" DROP CONSTRAINT "Agent_patchId_fkey";

-- DropForeignKey
ALTER TABLE "Damage" DROP CONSTRAINT "Damage_patchId_fkey";

-- DropForeignKey
ALTER TABLE "OwBug" DROP CONSTRAINT "OwBug_patchId_fkey";

-- DropForeignKey
ALTER TABLE "OwMap" DROP CONSTRAINT "OwMap_patchId_fkey";

-- DropForeignKey
ALTER TABLE "Support" DROP CONSTRAINT "Support_patchId_fkey";

-- DropForeignKey
ALTER TABLE "Tank" DROP CONSTRAINT "Tank_patchId_fkey";

-- DropForeignKey
ALTER TABLE "ValBug" DROP CONSTRAINT "ValBug_patchId_fkey";

-- DropForeignKey
ALTER TABLE "ValMap" DROP CONSTRAINT "ValMap_patchId_fkey";

-- AlterTable
ALTER TABLE "Patchnotes_ow" ADD COLUMN     "details" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Patchnotes_val" ADD COLUMN     "details" JSONB NOT NULL;

-- DropTable
DROP TABLE "Agent";

-- DropTable
DROP TABLE "Damage";

-- DropTable
DROP TABLE "OwBug";

-- DropTable
DROP TABLE "OwMap";

-- DropTable
DROP TABLE "Support";

-- DropTable
DROP TABLE "Tank";

-- DropTable
DROP TABLE "ValBug";

-- DropTable
DROP TABLE "ValMap";
