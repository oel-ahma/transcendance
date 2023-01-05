import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/prisma/user/user.service';
import { ProfileController } from './profile.controller';

@Module({
  providers: [PrismaService, UserService],
  controllers: [ProfileController],
})
export class ProfileModule {}
