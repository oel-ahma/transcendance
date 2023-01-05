-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('PRIVATE', 'PROTECTED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "ChannelUserStatus" AS ENUM ('BAN', 'KICK', 'MUTE', 'USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ChannelMessageType" AS ENUM ('MESSAGE', 'INVITE', 'SYSTEM');

-- CreateTable
CREATE TABLE "Channel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelUser" (
    "channelId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "until" TIMESTAMP(3),
    "state" "ChannelUserStatus" NOT NULL DEFAULT E'USER',

    CONSTRAINT "ChannelUser_pkey" PRIMARY KEY ("channelId","userId")
);

-- CreateTable
CREATE TABLE "ChannelMessage" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "type" "ChannelMessageType" NOT NULL DEFAULT E'MESSAGE',
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelUser" ADD CONSTRAINT "ChannelUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelUser" ADD CONSTRAINT "ChannelUser_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMessage" ADD CONSTRAINT "ChannelMessage_userId_channelId_fkey" FOREIGN KEY ("userId", "channelId") REFERENCES "ChannelUser"("channelId", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
