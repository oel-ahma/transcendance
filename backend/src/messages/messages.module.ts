import { Module } from '@nestjs/common';
import { ChannelsService } from 'src/prisma/channels/channels.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/prisma/user/user.service';
import { ChannelsGateway } from './channels.gateway';
import { ChannelCrudController } from './controllers/channel.crud.controller';
import { ChannelActionController } from './controllers/channel.actions.controller';
import { MessagesService } from './messages.service';
import { JwtService } from '@nestjs/jwt';
import { ChannelPrivateController } from './controllers/channel.private.controller';
import { DmService } from 'src/prisma/dm/dm.service';
import { FriendsService } from 'src/prisma/friends/friends.service';
import { GameService } from 'src/game/game.service';
import { GameService as GameServiceDB } from 'src/prisma/game/game.service';

@Module({
  providers: [
    ChannelsGateway,
    PrismaService,
    UserService,
    ChannelsService,
    MessagesService,
    JwtService,
    DmService,
    FriendsService,
    GameServiceDB,
    GameService,
  ],
  controllers: [
    ChannelCrudController,
    ChannelActionController,
    ChannelPrivateController,
  ],
})
export class MessagesModule {}
