import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Status } from '@prisma/client';
import UserPublic from 'src/prisma/user/user.public.interface';

@Injectable()
export class GameService {
  constructor(private eventEmitter: EventEmitter2) {}

  changeUserStatus(status: Status, user: UserPublic) {
    this.eventEmitter.emit('friends.status', status, user);
  }
}
