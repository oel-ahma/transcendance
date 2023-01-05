-- CreateEnum
CREATE TYPE "FriendShipStatus" AS ENUM ('WAITING', 'DENIED', 'ACCEPTED', 'BLOCKED');

-- CreateTable
CREATE TABLE "FriendShip" (
    "requesterId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "status" "FriendShipStatus" NOT NULL DEFAULT E'WAITING',

    CONSTRAINT "FriendShip_pkey" PRIMARY KEY ("requesterId","receiverId")
);

-- AddForeignKey
ALTER TABLE "FriendShip" ADD CONSTRAINT "FriendShip_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendShip" ADD CONSTRAINT "FriendShip_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
