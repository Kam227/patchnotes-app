-- CreateTable
CREATE TABLE "WinrateChangeHistory" (
    "id" SERIAL NOT NULL,
    "statisticsId" INTEGER NOT NULL,
    "winrateChange" DOUBLE PRECISION NOT NULL,
    "patchId" INTEGER NOT NULL,
    "character" TEXT NOT NULL,

    CONSTRAINT "WinrateChangeHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WinrateChangeHistory" ADD CONSTRAINT "WinrateChangeHistory_statisticsId_fkey" FOREIGN KEY ("statisticsId") REFERENCES "Statistics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
