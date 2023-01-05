-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "type" "GameType" NOT NULL DEFAULT 'PUBLIC';
