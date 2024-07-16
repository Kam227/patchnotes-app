-- CreateTable
CREATE TABLE "Words" (
    "id" SERIAL NOT NULL,
    "usableWords" TEXT[],
    "deletedWords" TEXT[],

    CONSTRAINT "Words_pkey" PRIMARY KEY ("id")
);
