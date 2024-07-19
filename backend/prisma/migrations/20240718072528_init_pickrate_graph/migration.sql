-- CreateTable
CREATE TABLE "Pickrate" (
    "id" SERIAL NOT NULL,
    "character" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Pickrate_pkey" PRIMARY KEY ("id")
);
