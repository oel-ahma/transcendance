import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FriendsService as FriendsDBService } from 'src/prisma/friends/friends.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/prisma/user/user.service';
import { FriendsController } from './friends.controller';
import { FriendsGateway } from './friends.gateway';
import { FriendsService } from './friends.service';

@Module({
  providers: [
    PrismaService,
    FriendsService,
    FriendsDBService,
    JwtService,
    UserService,
    FriendsGateway,
  ],
  controllers: [FriendsController],
})
export class FriendsModule {}
