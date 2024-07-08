/*
  Warnings:

  - You are about to drop the `Reply_ow` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reply_val` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Reply_ow" DROP CONSTRAINT "Reply_ow_commentId_fkey";

-- DropForeignKey
ALTER TABLE "Reply_ow" DROP CONSTRAINT "Reply_ow_replyToId_fkey";

-- DropForeignKey
ALTER TABLE "Reply_ow" DROP CONSTRAINT "Reply_ow_userId_fkey";

-- DropForeignKey
ALTER TABLE "Reply_val" DROP CONSTRAINT "Reply_val_commentId_fkey";

-- DropForeignKey
ALTER TABLE "Reply_val" DROP CONSTRAINT "Reply_val_replyToId_fkey";

-- DropForeignKey
ALTER TABLE "Reply_val" DROP CONSTRAINT "Reply_val_userId_fkey";

-- DropTable
DROP TABLE "Reply_ow";

-- DropTable
DROP TABLE "Reply_val";
