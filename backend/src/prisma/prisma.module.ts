import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UserService } from './user/user.service';
import { FriendsService } from './friends/friends.service';
import { ChannelsService } from './channels/channels.service';
import { DmService } from './dm/dm.service';
import { GameService } from './game/game.service';

@Module({
  providers: [
    PrismaService,
    UserService,
    FriendsService,
    ChannelsService,
    DmService,
    GameService,
  ],
  exports: [UserService],
})
export class PrismaModule {}
