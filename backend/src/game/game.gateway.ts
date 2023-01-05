import { ParseBoolPipe, ParseFloatPipe, UseInterceptors } from '@nestjs/common';
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
import { GameMode, GameStatus, GameType, User } from '@prisma/client';
import { Server } from 'socket.io';
import { AuthSocket, WSAuthMiddleware } from 'src/auth/websocket.middleware';
import { GameService as GameDBService } from 'src/prisma/game/game.service';
import { UserService } from 'src/prisma/user/user.service';
import { UserfieldsInterceptor } from 'src/prisma/user/userfields.interceptor';
import { GameRoom, PlayerSideLeft, PlayerSideRight } from './game.interface';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import UserPublic from 'src/prisma/user/user.public.interface';
import { GameService } from './game.service';

export interface GameMessageInformation {
  status: GameStatus;
  in_progress: boolean;
  users: {
    left: UserPublic;
    right?: UserPublic;
  };
  score: {
    left: number;
    right?: number;
  };
}

/**
 * Represents the game websocket gateway.
 *
 * @namespace games
 * @event connection(in) When an user try to connect to the server. Can fail if the user has another client logged somewhere else.
 * @event disconnect(in) When an user is disconnecting from the server.
 * @event move(in)       When an user is moving his racket. Can fail if user is too high or low.
 * @event move(out)      A broadcast when any user move
 * @event tick(out)      Send game informations (status, scores, time_spent, ball[position, vector, speed], players[2][position]) to all users in a room
 * @event score(out)     When a user score a point
 * @event start(out)     When a ball is launch
 * @class GameGateway
 */
@WebSocketGateway({
  namespace: 'games',
  cors: {
    origin: true,
  },
})
@UseInterceptors(new UserfieldsInterceptor())
export class GameGateway implements NestGateway {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly gameService: GameDBService,
    private readonly gameServ: GameService,
    private eventEmitter: EventEmitter2,
  ) {}

  @WebSocketServer()
  server: Server;

  games: Array<GameRoom>;
  connectedUsers: Array<number>;

  async afterInit(server) {
    this.games = [];
    this.connectedUsers = [];

    const middle = WSAuthMiddleware(
      this.jwtService,
      this.userService,
      this.configService,
    );
    server.use(middle);

    await this.gameService.delete({
      status: GameStatus.PENDING,
    });
  }

  isUserAlreadyConnected(user: User) {
    const connectedUser = this.connectedUsers.filter((u) => u == user.id);
    return connectedUser.length > 0;
  }

  async handleConnection(client: AuthSocket) {
    client.data.user = client.user;

    // We only allow one client per user to play/watch a game
    if (this.isUserAlreadyConnected(client.user)) {
      client.disconnect();
      return;
      // throw new WsException('Already logged in on another client');
    }

    this.connectedUsers.push(client.user.id);

    // We inform the game room that the client connect
    const userGame = this.games.filter((g) => g.isUserInMatch(client.user));
    if (userGame.length == 1) {
      this.gameServ.changeUserStatus('PLAYING', client.user);
      userGame[0].userConnect(client);
    }
  }

  async getGame(id): Promise<GameMessageInformation> {
    const game = this.games.filter((g) => g.id == id);
    if (game.length > 0) {
      return {
        in_progress: true,
        status: GameStatus.PENDING,
        score: {
          left: game[0].getGame().players.left.points,
          right: game[0].getGame().players.right?.points,
        },
        users: {
          left: game[0].getGame().players.left.connected,
          right: game[0].getGame().players.right.connected,
        },
      };
    }

    const gameDB = await this.gameService.game({
      id: id,
    });
    if (!gameDB) {
      return null;
    }
    return {
      in_progress: true,
      status: gameDB.status,
      score: {
        left: gameDB.pointsLeft,
        right: gameDB.pointsRight,
      },
      users: {
        left: gameDB.leftPlayer,
        right: gameDB.rightPlayer,
      },
    };
  }

  handleDisconnect(client: AuthSocket) {
    let indexUser = 0;
    while (indexUser > -1) {
      indexUser = this.connectedUsers.indexOf(client.data.user.id);
      if (indexUser > -1) this.connectedUsers.splice(indexUser);
    }

    // We inform the game room that the client disconnect
    const userGame = this.games.filter(
      (g) => g.isUserInMatch(client.user) || g.isSpectator(client.user),
    );
    if (userGame.length == 1) {
      const gameResult = userGame[0].userDisconnect(client);

      if (gameResult.shouldDeleteGame) {
        this.removeGame(
          gameResult,
          userGame[0],
          userGame[0].isUserInMatch(client.user),
        );
      }
    }
  }

  @SubscribeMessage('new')
  newGame(
    @MessageBody('match_making', ParseBoolPipe) isMatchMakingEnabled = true,
    @MessageBody('game_mode') gameMode: string | null = null,
    @ConnectedSocket()
    client: AuthSocket,
  ) {
    if (!gameMode) {
      gameMode = GameMode.NORMAL;
    }
    if (!(gameMode in GameMode)) {
      throw new WsException('Unknown game mode.');
    }

    const userGame = this.games.filter(
      (g) => g.isUserInMatch(client.user) || g.isSpectator(client.user),
    );
    if (userGame.length > 0) throw new WsException('You already are in game.');

    if (isMatchMakingEnabled) {
      const joinableGames = this.games.filter(
        (game, index, games) =>
          games[index].mode === gameMode &&
          games[index].canPlayerJoin(client.user),
      );
      if (joinableGames.length > 0) {
        this.gameServ.changeUserStatus('PLAYING', client.user);
        return joinableGames[0].userConnect(client);
      }
    }

    this.gameServ.changeUserStatus('PLAYING', client.user);
    const client_game = new GameRoom(
      !isMatchMakingEnabled,
      gameMode as GameMode,
      this.server,
      client,
      this.eventEmitter,
    );
    this.games.push(client_game);
    return client_game.getGame();
  }

  @SubscribeMessage('join')
  joinGame(
    @MessageBody('room') roomId: string,
    @MessageBody('spectate', ParseBoolPipe) spectate = false,
    @ConnectedSocket() client: AuthSocket,
  ) {
    const userGame = this.games.filter(
      (g) => g.isUserInMatch(client.user) || g.isSpectator(client.user),
    );
    if (userGame.length > 0) return false;

    let game: GameRoom[] | GameRoom = this.games.filter((g) => g.id == roomId);
    if (game.length <= 0) return false;

    game = game[0];
    if (spectate) return game.spectatorConnect(client);

    this.gameServ.changeUserStatus('PLAYING', client.user);
    return game.userConnect(client);
  }

  @SubscribeMessage('move')
  movePad(
    @MessageBody('room') roomId: string,
    @MessageBody('position', ParseFloatPipe) position,
    @ConnectedSocket() client: AuthSocket,
  ) {
    let game: GameRoom[] | GameRoom = this.games.filter((g) => g.id == roomId);
    if (game.length <= 0) throw new WsException('No game found with this id.');
    game = game[0];

    const side = game.isUserInMatch(client.user);
    if (!side) throw new WsException('User not in match');

    game.setUserPosition(side, position);
  }

  @SubscribeMessage('leave')
  async playerLeave(@ConnectedSocket() client: AuthSocket) {
    // We inform the game room that the client disconnect
    const userGame = this.games.filter(
      (g) => g.isUserInMatch(client.user) || g.isSpectator(client.user),
    );
    userGame.forEach((game) => {
      if (!game.isUserInMatch(client.user)) {
        game.userDisconnect(client);
      } else {
        const otherPlayer = game.getOppositeSide(
          game.isUserInMatch(client.user),
        );

        if (game.isDisconnected(otherPlayer)) {
          this.gameServ.changeUserStatus('ONLINE', client.user);
          const gameResult = game.userDisconnect(client);
          this.removeGame(gameResult, game, game.getOppositeSide(otherPlayer));
        }
      }
    });
  }

  private removeGame(
    gameResult: {
      shouldDeleteGame: boolean;
      playerWin: boolean;
    },
    game: GameRoom,
    playerWinner: PlayerSideLeft | PlayerSideRight,
  ) {
    this.server.in(game.id).socketsLeave(game.id);

    if (gameResult.playerWin) {
      const point = Math.max(
        game.getGame().players.left.points,
        game.getGame().players.right.points,
      );

      this.gameService.add({
        id: game.id,
        status: playerWinner == 'left' ? 'WIN' : 'LOSE',
        pointsLeft: playerWinner == 'left' ? (point == 0 ? 5 : 0) : 0,
        pointsRight: playerWinner == 'right' ? (point == 0 ? 5 : 0) : 0,
        mode: game.mode,
        duration: game.getDuration(),
        type: game.is_private ? GameType.PRIVATE : GameType.PUBLIC,
        leftPlayer: {
          connect: {
            name: game.getGame().players.left.connected.name,
          },
        },
        rightPlayer: {
          connect: {
            name: game.getGame().players.right.connected.name,
          },
        },
      });
    }

    game.end();
    this.games.splice(this.games.indexOf(game), 1);
  }

  @OnEvent('game.end')
  async gameEnd(
    payload: GameRoom,
    winner: PlayerSideLeft | PlayerSideRight,
    is_private: boolean,
  ) {
    this.server.in(payload.id).emit('game_over', payload.getGame());
    this.server.in(payload.id).socketsLeave(payload.id);

    await this.gameService.add({
      id: payload.id,
      status: winner == 'left' ? 'WIN' : 'LOSE',
      pointsLeft: payload.getGame().players.left.points,
      pointsRight: payload.getGame().players.right.points,
      duration: payload.getDuration(),
      leftPlayer: {
        connect: {
          name: payload.getGame().players.left.connected.name,
        },
      },
      rightPlayer: {
        connect: {
          name: payload.getGame().players.right.connected.name,
        },
      },
    });

    this.gameServ.changeUserStatus(
      'ONLINE',
      payload.getGame().players.left.connected,
    );
    this.gameServ.changeUserStatus(
      'ONLINE',
      payload.getGame().players.right.connected,
    );

    this.games.splice(this.games.indexOf(payload), 1);
  }

  getUserGame(user: User) {
    const game: GameRoom[] | GameRoom = this.games.filter((g) =>
      g.isUserInMatch(user),
    );

    if (game.length == 0) return null;
    return game[0];
  }

  getGameById(id: string) {
    const game: GameRoom[] | GameRoom = this.games.filter((g) => g.id == id);

    if (game.length == 0) return null;
    return game[0].getGame();
  }
}
