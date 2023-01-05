import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Status, User } from '@prisma/client';
import { UserService } from 'src/prisma/user/user.service';
import { FriendsGateway } from './friends.gateway';

@Injectable()
export class FriendsService {
  constructor(
    private eventEmiter: EventEmitter2,
    private readonly friendsGateway: FriendsGateway,
    private readonly userService: UserService,
  ) {}

  @OnEvent('friends.status')
  async changeInternalStatus(status: Status, user: User) {
    await this.userService.updateStatus(user, status);
    this.friendsGateway.server.to('' + user.id).emit('status', user.id, status);
  }
}
