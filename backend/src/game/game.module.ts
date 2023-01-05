import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameService as GameModelService } from 'src/prisma/game/game.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/prisma/user/user.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { FriendsService } from 'src/prisma/friends/friends.service';

@Module({
  providers: [
    PrismaService,
    GameGateway,
    FriendsService,
    GameService,
    JwtService,
    GameModelService,
    UserService,
    ConfigService,
  ],
  controllers: [GameController],
})
export class GameModule {}
