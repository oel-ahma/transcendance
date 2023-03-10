import { ParseIntPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { NestGateway } from '@nestjs/websockets/interfaces/nest-gateway.interface';
import { AuthSocket, WSAuthMiddleware } from 'src/auth/websocket.middleware';
import { ChannelsService } from 'src/prisma/channels/channels.service';
import {
  localUploadToURL,
  UserRequest,
  UserService,
} from 'src/prisma/user/user.service';
import { Server } from 'socket.io';
import {
  Channel,
  ChannelMessageType,
  ChannelUserStatus,
  DMChannel,
  DMChannelMessage,
  FriendShipStatus,
  User,
} from '@prisma/client';
import { DmService } from 'src/prisma/dm/dm.service';
import { FriendsService } from 'src/prisma/friends/friends.service';

@WebSocketGateway({
  namespace: 'channels',
  cors: {
    origin: true,
  },
})
export class ChannelsGateway implements NestGateway {
  constructor(
    private readonly channelService: ChannelsService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly dmService: DmService,
    private readonly friendService: FriendsService,
  ) {}

  @WebSocketServer()
  private server: Server;

  afterInit(server) {
    const middle = WSAuthMiddleware(
      this.jwtService,
      this.userService,
      this.configService,
    );
    server.use(middle);
  }

  async handleConnection(client: AuthSocket) {
    client.data.user = client.user;

    const channels = await this.channelService.channelsForUser(client.user);
    channels.forEach((channel) => {
      client.join(`channel-${channel.id}`);
    });

    const dmChannels = await this.dmService.get(client.user);
    dmChannels.forEach((channel) => {
      client.join(`dm-channel-${channel.id}`);
    });
  }

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody('channel', ParseIntPipe) channel_id: number,
    @MessageBody('message') message: string,
    @ConnectedSocket() socket: AuthSocket,
  ) {
    if (message.length <= 0 || message.length > 2500)
      throw new WsException('Message too long');

    const isUserInChannel = await this.channelService.isUserInChannel(
      channel_id,
      socket.user,
    );
    if (isUserInChannel === false) throw new WsException('User not in channel');
    if (isUserInChannel.muted) throw new WsException('User muted');

    await this.channelService.addMessage(channel_id, socket.user, message);

    socket.broadcast.to(`channel-${channel_id}`).emit('message', {
      channel: channel_id,
      message,
      user: {
        id: socket.user.id,
        name: socket.user.name,
        avatar: localUploadToURL(socket.user.avatar),
      },
    });

    return 'ok';
  }

  @SubscribeMessage('game')
  async handleGameMessage(
    @MessageBody('channel', ParseIntPipe) channel_id: number,
    @MessageBody('game_id') game_id: string,
    @ConnectedSocket() socket: AuthSocket,
  ) {
    const isUserInChannel = await this.channelService.isUserInChannel(
      channel_id,
      socket.user,
    );
    if (isUserInChannel === false) throw new WsException('User not in channel');
    if (isUserInChannel.muted) throw new WsException('User muted');

    await this.channelService.addMessage(
      channel_id,
      socket.user,
      game_id,
      ChannelMessageType.GAME,
    );

    socket.broadcast.to(`channel-${channel_id}`).emit('message', {
      type: ChannelMessageType.GAME,
      channel: channel_id,
      message: game_id,
      user: {
        id: socket.user.id,
        name: socket.user.name,
        avatar: localUploadToURL(socket.user.avatar),
      },
    });

    return 'ok';
  }

  @SubscribeMessage('dm_message')
  async handleDMMessage(
    @MessageBody('user', ParseIntPipe) user_id: number,
    @MessageBody('message') message: string,
    @ConnectedSocket() socket: AuthSocket,
  ) {
    if (message.length <= 0 || message.length > 2500)
      throw new WsException('Message too long');

    // Check Friendship status
    const friends: { status: FriendShipStatus; requester: User } | null =
      await this.friendService.friendsWith(
        { id: socket.user.id },
        { id: user_id },
      );
    if (!friends || friends.status != FriendShipStatus.ACCEPTED)
      throw new WsException('Users are not friends');

    let dmChannel: DMChannel | null = await this.dmService.channel({
      DMChannelUser: {
        every: {
          OR: [{ userId: socket.user.id }, { userId: user_id }],
        },
      },
    });
    if (!dmChannel) {
      dmChannel = await this.dmService.create(socket.user.id, user_id);
    }

    const sentMessage: DMChannelMessage = await this.dmService.sendMessage(
      dmChannel,
      socket.user,
      message,
    );

    socket.broadcast.to(`dm-channel-${dmChannel.id}`).emit('dm_message', {
      id: sentMessage.id,
      message: sentMessage.content,
      gameId: sentMessage.gameId,
      type: sentMessage.type,
      postedAt: sentMessage.postedAt,
      updatedAt: sentMessage.updatedAt,
      userId: sentMessage.userId,
      DmChannel: sentMessage.DmChannel,
      user: {
        id: socket.user.id,
        name: socket.user.name,
        avatar: localUploadToURL(socket.user.avatar),
      },
    });

    return 'ok';
  }

  @SubscribeMessage('dm_game')
  async handleDMGameMessage(
    @MessageBody('user', ParseIntPipe) user_id: number,
    @MessageBody('game_id') game_id: string,
    @ConnectedSocket() socket: AuthSocket,
  ) {
    // Check Friendship status
    const friends: { status: FriendShipStatus; requester: User } | null =
      await this.friendService.friendsWith(
        { id: socket.user.id },
        { id: user_id },
      );
    if (!friends || friends.status != FriendShipStatus.ACCEPTED)
      throw new WsException('Users are not friends');

    let dmChannel: DMChannel | null = await this.dmService.channel({
      DMChannelUser: {
        every: {
          OR: [{ userId: socket.user.id }, { userId: user_id }],
        },
      },
    });
    if (!dmChannel) {
      dmChannel = await this.dmService.create(socket.user.id, user_id);
    }

    await this.dmService.sendMessage(
      dmChannel,
      socket.user,
      game_id,
      ChannelMessageType.GAME,
    );

    socket.broadcast.to(`dm-channel-${dmChannel.id}`).emit('dm_message', {
      content: game_id,
      type: ChannelMessageType.GAME,
      DmChannel: dmChannel.id,
      user: {
        id: socket.user.id,
        name: socket.user.name,
        avatar: socket.user.avatar,
      },
    });

    return 'ok';
  }

  async userJoinChannel(channel: Channel, user: UserRequest) {
    const connectedUsers = await this.server.fetchSockets();

    connectedUsers.forEach((connectedUser) => {
      if (connectedUser.data.user.id == user.id) {
        connectedUser.join(`channel-${channel.id}`);
      }
    });

    this.server.to(`channel-${channel.id}`).emit('join', {
      channel: channel.id,
      user: {
        id: user.id,
        name: user.name,
        avatar: localUploadToURL(user.avatar),
      },
    });
  }

  async actionOnChannel(
    channel: Channel,
    action: { role: ChannelUserStatus; user?: UserRequest },
  ) {
    await this.server.to(`channel-${channel.id}`).emit('action', {
      channel: channel.id,
      role: action.role,
      user: {
        id: action.user.id,
        name: action.user.name,
        avatar: localUploadToURL(action.user.avatar),
      },
    });
  }

  async userLeftChannel(channel: Channel, user: UserRequest) {
    const roomUsers = await this.server
      .in(`channel-${channel.id}`)
      .fetchSockets();

    await this.server.to(`channel-${channel.id}`).emit('leave', {
      channel: channel.id,
      user: {
        id: user.id,
        name: user.name,
        avatar: localUploadToURL(user.avatar),
      },
    });

    roomUsers.forEach((roomUser) => {
      if (roomUser.data.user.id == user.id) {
        roomUser.leave(`channel-${channel.id}`);
      }
    });
  }

  async removeUserFromChannel(channel: Channel, user: UserRequest) {
    const roomUsers = await this.server
      .in(`channel-${channel.id}`)
      .fetchSockets();

    roomUsers.forEach((roomUser) => {
      if (roomUser.data.user.id == user.id) {
        roomUser.leave(`channel-${channel.id}`);
      }
    });
  }

  deleteChannel(channel: Channel) {
    this.server
      .to(`channel-${channel.id}`)
      .emit('delete', { channel: channel.id });

    this.server
      .in(`channel-${channel.id}`)
      .socketsLeave(`channel-${channel.id}`);
  }
}
