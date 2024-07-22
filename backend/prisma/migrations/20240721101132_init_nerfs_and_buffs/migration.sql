-- CreateTable
CREATE TABLE "Nerf" (
    "id" SERIAL NOT NULL,
    "character" TEXT NOT NULL,
    "patchIdOW" INTEGER,
    "patchIdLOL" INTEGER,
    "details" JSONB NOT NULL,

    CONSTRAINT "Nerf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Buff" (
    "id" SERIAL NOT NULL,
    "character" TEXT NOT NULL,
    "patchIdOW" INTEGER,
    "patchIdLOL" INTEGER,
    "details" JSONB NOT NULL,

    CONSTRAINT "Buff_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Nerf" ADD CONSTRAINT "Nerf_patchIdOW_fkey" FOREIGN KEY ("patchIdOW") REFERENCES "Patchnotes_ow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nerf" ADD CONSTRAINT "Nerf_patchIdLOL_fkey" FOREIGN KEY ("patchIdLOL") REFERENCES "Patchnotes_lol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Buff" ADD CONSTRAINT "Buff_patchIdOW_fkey" FOREIGN KEY ("patchIdOW") REFERENCES "Patchnotes_ow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Buff" ADD CONSTRAINT "Buff_patchIdLOL_fkey" FOREIGN KEY ("patchIdLOL") REFERENCES "Patchnotes_lol"("id") ON DELETE SET NULL ON UPDATE CASCADE;
