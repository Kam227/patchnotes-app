/*
  Warnings:

  - You are about to drop the `Comment_val` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Patchnotes_val` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reply_val` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Vote_val` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Comment_val" DROP CONSTRAINT "Comment_val_patchId_fkey";

-- DropForeignKey
ALTER TABLE "Comment_val" DROP CONSTRAINT "Comment_val_userId_fkey";

-- DropForeignKey
ALTER TABLE "Reply_val" DROP CONSTRAINT "Reply_val_commentId_fkey";

-- DropForeignKey
ALTER TABLE "Reply_val" DROP CONSTRAINT "Reply_val_parentReplyId_fkey";

-- DropForeignKey
ALTER TABLE "Reply_val" DROP CONSTRAINT "Reply_val_replyToId_fkey";

-- DropForeignKey
ALTER TABLE "Reply_val" DROP CONSTRAINT "Reply_val_userId_fkey";

-- DropForeignKey
ALTER TABLE "Vote_val" DROP CONSTRAINT "Vote_val_commentId_fkey";

-- DropForeignKey
ALTER TABLE "Vote_val" DROP CONSTRAINT "Vote_val_userId_fkey";

-- DropTable
DROP TABLE "Comment_val";

-- DropTable
DROP TABLE "Patchnotes_val";

-- DropTable
DROP TABLE "Reply_val";

-- DropTable
DROP TABLE "Vote_val";

-- CreateTable
CREATE TABLE "Patchnotes_lol" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "details" JSONB NOT NULL,

    CONSTRAINT "Patchnotes_lol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment_lol" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "patchId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Comment_lol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote_lol" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "commentId" INTEGER NOT NULL,

    CONSTRAINT "Vote_lol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reply_lol" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "commentId" INTEGER NOT NULL,
    "parentReplyId" INTEGER,
    "replyToId" INTEGER NOT NULL,

    CONSTRAINT "Reply_lol_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Comment_lol" ADD CONSTRAINT "Comment_lol_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patchnotes_lol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment_lol" ADD CONSTRAINT "Comment_lol_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote_lol" ADD CONSTRAINT "Vote_lol_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote_lol" ADD CONSTRAINT "Vote_lol_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment_lol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply_lol" ADD CONSTRAINT "Reply_lol_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply_lol" ADD CONSTRAINT "Reply_lol_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment_lol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply_lol" ADD CONSTRAINT "Reply_lol_parentReplyId_fkey" FOREIGN KEY ("parentReplyId") REFERENCES "Reply_lol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply_lol" ADD CONSTRAINT "Reply_lol_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
