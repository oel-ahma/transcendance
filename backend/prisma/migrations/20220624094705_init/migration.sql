-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ONLINE', 'AWAY', 'PLAYING', 'OFFLINE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT E'OFFLINE',
    "avatar" TEXT,
    "intra_id" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");
