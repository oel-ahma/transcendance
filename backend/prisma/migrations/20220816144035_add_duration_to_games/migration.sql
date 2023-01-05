-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('PENDING', 'DRAW', 'WIN', 'LOSE');

-- AlterTable
ALTER TABLE "Channel" ALTER COLUMN "type" SET DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "ChannelMessage" ADD COLUMN     "gameId" TEXT;

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'PENDING',
    "pointsLeft" INTEGER NOT NULL DEFAULT 0,
    "pointsRight" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "rightUserId" INTEGER NOT NULL,
    "leftUserId" INTEGER NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChannelMessage" ADD CONSTRAINT "ChannelMessage_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_leftUserId_fkey" FOREIGN KEY ("leftUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_rightUserId_fkey" FOREIGN KEY ("rightUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
