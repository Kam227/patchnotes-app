/*
  Warnings:

  - You are about to drop the `Words` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Words";

-- CreateTable
CREATE TABLE "Word" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);
