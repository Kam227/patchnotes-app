/*
  Warnings:

  - A unique constraint covering the columns `[character]` on the table `Statistics` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Statistics_character_key" ON "Statistics"("character");
