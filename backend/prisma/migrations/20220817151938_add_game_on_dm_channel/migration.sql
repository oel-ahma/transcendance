-- AlterTable
ALTER TABLE "DMChannelMessage" ADD COLUMN     "gameId" TEXT;

-- AddForeignKey
ALTER TABLE "DMChannelMessage" ADD CONSTRAINT "DMChannelMessage_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
