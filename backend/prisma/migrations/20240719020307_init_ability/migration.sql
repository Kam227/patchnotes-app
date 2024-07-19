-- CreateTable
CREATE TABLE "Ability" (
    "id" SERIAL NOT NULL,
    "patchId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "percentile" DOUBLE PRECISION NOT NULL,
    "overallPercentile" DOUBLE PRECISION,

    CONSTRAINT "Ability_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ability" ADD CONSTRAINT "Ability_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patchnotes_ow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
