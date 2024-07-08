
CREATE TABLE "Comment_ow" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "patchId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Comment_ow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment_val" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "patchId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Comment_val_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Comment_ow" ADD CONSTRAINT "Comment_ow_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patchnotes_ow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment_ow" ADD CONSTRAINT "Comment_ow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment_val" ADD CONSTRAINT "Comment_val_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patchnotes_val"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment_val" ADD CONSTRAINT "Comment_val_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
