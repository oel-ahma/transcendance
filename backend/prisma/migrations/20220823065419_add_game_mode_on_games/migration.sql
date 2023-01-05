-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('NORMAL', 'SPECIAL', 'NOT_NORMAL');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "mode" "GameMode" NOT NULL DEFAULT 'NORMAL';
