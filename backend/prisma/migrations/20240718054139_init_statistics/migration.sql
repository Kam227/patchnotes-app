-- CreateTable
CREATE TABLE "Statistics" (
    "id" SERIAL NOT NULL,
    "character" TEXT NOT NULL,
    "pickrate" INTEGER NOT NULL,
    "winrate" INTEGER NOT NULL,
    "banrate" INTEGER,
    "kda" INTEGER,

    CONSTRAINT "Statistics_pkey" PRIMARY KEY ("id")
);
