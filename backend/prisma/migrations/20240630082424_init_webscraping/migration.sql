-- CreateTable
CREATE TABLE "Patchnotes_ow" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Patchnotes_ow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tank" (
    "id" SERIAL NOT NULL,
    "patchId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Tank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Damage" (
    "id" SERIAL NOT NULL,
    "patchId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Damage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Support" (
    "id" SERIAL NOT NULL,
    "patchId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Support_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwMap" (
    "id" SERIAL NOT NULL,
    "patchId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "OwMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwBug" (
    "id" SERIAL NOT NULL,
    "patchId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "OwBug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patchnotes_val" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Patchnotes_val_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" SERIAL NOT NULL,
    "patchId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValMap" (
    "id" SERIAL NOT NULL,
    "patchId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "ValMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValBug" (
    "id" SERIAL NOT NULL,
    "patchId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "ValBug_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Tank" ADD CONSTRAINT "Tank_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patchnotes_ow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Damage" ADD CONSTRAINT "Damage_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patchnotes_ow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Support" ADD CONSTRAINT "Support_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patchnotes_ow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwMap" ADD CONSTRAINT "OwMap_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patchnotes_ow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwBug" ADD CONSTRAINT "OwBug_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patchnotes_ow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patchnotes_val"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValMap" ADD CONSTRAINT "ValMap_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patchnotes_val"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValBug" ADD CONSTRAINT "ValBug_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patchnotes_val"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
