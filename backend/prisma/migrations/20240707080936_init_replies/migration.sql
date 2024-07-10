-- CreateTable
CREATE TABLE "Reply_ow" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "commentId" INTEGER NOT NULL,
    "replyToId" INTEGER NOT NULL,

    CONSTRAINT "Reply_ow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reply_val" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "commentId" INTEGER NOT NULL,
    "replyToId" INTEGER NOT NULL,

    CONSTRAINT "Reply_val_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Reply_ow" ADD CONSTRAINT "Reply_ow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply_ow" ADD CONSTRAINT "Reply_ow_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment_ow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply_ow" ADD CONSTRAINT "Reply_ow_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply_val" ADD CONSTRAINT "Reply_val_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply_val" ADD CONSTRAINT "Reply_val_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment_val"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply_val" ADD CONSTRAINT "Reply_val_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
