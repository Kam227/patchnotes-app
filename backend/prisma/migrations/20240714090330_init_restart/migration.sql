-- CreateTable
CREATE TABLE "Association" (
    "id" SERIAL NOT NULL,
    "nerf" JSONB NOT NULL,
    "buff" JSONB NOT NULL,

    CONSTRAINT "Association_pkey" PRIMARY KEY ("id")
);
