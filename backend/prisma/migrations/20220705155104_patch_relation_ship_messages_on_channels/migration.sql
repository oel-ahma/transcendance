-- DropForeignKey
ALTER TABLE "ChannelMessage" DROP CONSTRAINT "ChannelMessage_userId_channelId_fkey";

-- AlterTable
ALTER TABLE "ChannelMessage" ADD COLUMN     "channelUserChannelId" INTEGER,
ADD COLUMN     "channelUserUserId" INTEGER;

-- AddForeignKey
ALTER TABLE "ChannelMessage" ADD CONSTRAINT "ChannelMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMessage" ADD CONSTRAINT "ChannelMessage_channelUserChannelId_channelUserUserId_fkey" FOREIGN KEY ("channelUserChannelId", "channelUserUserId") REFERENCES "ChannelUser"("channelId", "userId") ON DELETE SET NULL ON UPDATE CASCADE;
