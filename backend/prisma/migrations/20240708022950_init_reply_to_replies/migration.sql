-- AlterTable
ALTER TABLE "Reply_ow" ADD COLUMN     "parentReplyId" INTEGER;

-- AlterTable
ALTER TABLE "Reply_val" ADD COLUMN     "parentReplyId" INTEGER;

-- AddForeignKey
ALTER TABLE "Reply_ow" ADD CONSTRAINT "Reply_ow_parentReplyId_fkey" FOREIGN KEY ("parentReplyId") REFERENCES "Reply_ow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply_val" ADD CONSTRAINT "Reply_val_parentReplyId_fkey" FOREIGN KEY ("parentReplyId") REFERENCES "Reply_val"("id") ON DELETE SET NULL ON UPDATE CASCADE;
