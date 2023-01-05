import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class GameService {
  constructor(private readonly prismaService: PrismaService) {}

  async game(cond: Prisma.GameWhereUniqueInput) {
    return this.prismaService.game.findUnique({
      where: cond,
      include: {
        leftPlayer: true,
        rightPlayer: true,
      },
    });
  }

  async userGame(user: User) {
    return this.prismaService.game.findMany({
      where: {
        OR: [{ leftPlayer: user }, { rightPlayer: user }],
      },
      orderBy: {
        created_at: "asc",
      }
    });
  }

  async delete(condition: Prisma.GameWhereInput) {
    return this.prismaService.game.deleteMany({
      where: condition,
    });
  }

  async add(data: Prisma.GameCreateInput) {
    return this.prismaService.game.create({
      data,
    });
  }
}
