/*
  Warnings:

  - You are about to drop the `Pickrate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Pickrate";

-- CreateTable
CREATE TABLE "PickrateHistory" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DOUBLE PRECISION NOT NULL,
    "statisticsId" INTEGER NOT NULL,

    CONSTRAINT "PickrateHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PickrateHistory" ADD CONSTRAINT "PickrateHistory_statisticsId_fkey" FOREIGN KEY ("statisticsId") REFERENCES "Statistics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
