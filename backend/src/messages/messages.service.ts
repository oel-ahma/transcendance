import { Injectable } from '@nestjs/common';
import { ChannelUser, ChannelUserStatus } from '@prisma/client';
import { Channel } from '@prisma/client';
import { ChannelsService } from 'src/prisma/channels/channels.service';

@Injectable()
export class MessagesService {
  constructor(private readonly channelDB: ChannelsService) {}

  private readonly gradePermissions = {
    [ChannelUserStatus.MODERATOR]: [
      ChannelUserStatus.KICK,
      ChannelUserStatus.INVITE,
      ChannelUserStatus.MUTE,
      ChannelUserStatus.USER,
    ],
    [ChannelUserStatus.ADMIN]: [
      ChannelUserStatus.BAN,
      ChannelUserStatus.KICK,
      ChannelUserStatus.MUTE,
      ChannelUserStatus.USER,
      ChannelUserStatus.INVITE,
      ChannelUserStatus.MODERATOR,
    ],
  };

  hasUserPermission(
    channel: Channel,
    source: ChannelUser,
    target: ChannelUser,
    action: ChannelUserStatus,
  ): boolean {
    if (source.userId == channel.ownerId && target.userId != source.userId)
      return true;

    if (source.state in this.gradePermissions) {
      const userPermissions = this.gradePermissions[source.state];
      if (
        userPermissions.includes(action) &&
        userPermissions.includes(target.state)
      )
        return true;
    }
    return false;
  }
}
