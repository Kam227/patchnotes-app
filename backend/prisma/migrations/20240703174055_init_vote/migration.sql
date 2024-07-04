-- AlterTable
ALTER TABLE "Comment_ow" ADD COLUMN     "voteCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Comment_val" ADD COLUMN     "voteCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Vote_ow" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "commentId" INTEGER NOT NULL,

    CONSTRAINT "Vote_ow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote_val" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "commentId" INTEGER NOT NULL,

    CONSTRAINT "Vote_val_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Vote_ow" ADD CONSTRAINT "Vote_ow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote_ow" ADD CONSTRAINT "Vote_ow_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment_ow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote_val" ADD CONSTRAINT "Vote_val_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote_val" ADD CONSTRAINT "Vote_val_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment_val"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
