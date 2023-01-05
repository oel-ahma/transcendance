import { GameMode, User } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Server } from 'socket.io';
import { AuthSocket } from 'src/auth/websocket.middleware';
import UserPublic from 'src/prisma/user/user.public.interface';
import { v4 as uuidv4 } from 'uuid';
import { localUploadToURL } from 'src/prisma/user/user.service';

const GAME_HEIGHT = 50;
const GAME_WIDTH = 50;
const PAD_WIDTH = 2;
const BALL_RADIUS = 1;
const LEFT_PAD_FRONT_BOUNDARY = -GAME_WIDTH + 7;
const RIGHT_PAD_FRONT_BOUNDARY = GAME_WIDTH - 7;
const MAX_SPEED = 1;

export interface Position1D {
  x: number;
}

export interface Position2D extends Position1D {
  y: number;
}

export interface Ball {
  position: Position2D;
  vector: Position2D;
}

export type PlayerSideLeft = 'left';
export type PlayerSideRight = 'right';
type PlayerSide = PlayerSideLeft | PlayerSideRight;
export interface Player {
  position: Position1D;
  last_move: Date;
  points: number;
  connected: UserPublic;
  left_at: Date | null;
  moveTop: boolean;
  moveBottom: boolean;
}

export type GameWaiting = 'waiting';
export type GameWaitingStart = 'start';
export type GamePlaying = 'playing';
export type GameEnd = 'end';
type GameStatus = GameWaiting | GameWaitingStart | GamePlaying | GameEnd;

// status, scores, time_spent, ball[position, vector, speed], players[2][position]
export interface GameInformation {
  paused: boolean;
  status: GameStatus;
  players: Record<PlayerSide, Player | null>;
  time_spent: Date;
  ball: Ball;
  padHeight: number;
}

export type UserType = 'player' | 'spectator';

type UserID = number;

export class GameRoom {
  spectators: Array<UserID>;
  readonly id: string;

  private game: GameInformation;
  private server;

  private events = [];

  constructor(
    readonly is_private: boolean,
    readonly mode: GameMode,
    server: Server,
    socket: AuthSocket,
    private eventEmitter: EventEmitter2,
  ) {
    this.id = uuidv4();

    this.server = server.to(this.id);
    socket.user.avatar = localUploadToURL(socket.user.avatar);
    this.game = {
      padHeight: this.mode == 'NOT_NORMAL' ? 15 : 30,
      ball: {
        position: {
          x: 0,
          y: 0,
        },
        vector: {
          x: 0,
          y: 0,
        },
      },
      paused: true,
      players: {
        left: {
          connected: socket.user,
          points: 0,
          position: {
            x: 0,
          },
          last_move: new Date(),
          left_at: null,
          moveTop: false,
          moveBottom: false,
        },
        right: null,
      },
      status: 'waiting',
      time_spent: new Date(),
    };
    this.spectators = [];
    socket.join(this.id);

    // Init managers
    this.handleHeartBeat();
  }

  public end() {
    this.events.forEach((ev) => {
      clearInterval(ev);
    });
    this.events = [];
  }

  public getGame(): GameInformation & { id: string; date: Date } {
    return { ...this.game, id: this.id, date: new Date() };
  }

  private addUser(user: User): UserType {
    if (this.isUserInMatch(user)) {
      return 'player';
    }
    if (this.game.players.right == null) {
      user.avatar = localUploadToURL(user.avatar);
      this.game.players.right = {
        connected: user,
        points: 0,
        position: {
          x: 0,
        },
        last_move: new Date(),
        left_at: null,
        moveTop: false,
        moveBottom: false,
      };
      return 'player';
    }
    this.spectators.push(user.id);
    return 'spectator';
  }

  public userConnect(socket: AuthSocket) {
    socket.join(this.id);
    const side = this.isUserInMatch(socket.user);
    if (!side) {
      const type = this.addUser(socket.user);

      if (type == 'player') {
        this.game.status = 'start';

        this.startRound(true);
        this.handleBallMove();
      }

      const infos = {
        type,
        side: type == 'player' ? 'right' : null,
        game: this.getGame(),
      };
      this.server.emit('join', infos);

      return infos;
    }

    socket.user.avatar = localUploadToURL(socket.user.avatar);
    this.game.players[side].connected = socket.user;
    this.game.players[side].left_at = null;

    this.server.emit('join', {
      type: 'player',
      side,
      game: this.getGame(),
    });

    if (this.game.players.right && this.game.players.left) this.resumeRound();
  }

  public spectatorConnect(socket: AuthSocket) {
    socket.join(this.id);
    this.spectators.push(socket.user.id);
    this.server.emit('spectator', socket.user);
    return this.getGame();
  }

  public isSpectator(user: User): boolean {
    const spectatorUser = this.spectators.filter((el) => user.id == el);
    return spectatorUser.length == 1;
  }

  /**
   * When an user is disconnected, we pause the game where it played
   * @param socket User
   */
  public userDisconnect(socket: AuthSocket): {
    shouldDeleteGame: boolean;
    playerWin: boolean;
  } {
    socket.leave(this.id);
    const side = this.isUserInMatch(socket.user);
    if (!side) {
      const index_spec = this.spectators.indexOf(socket.user.id);
      if (index_spec > -1) this.spectators.splice(index_spec, 1);
    } else {
      // Set player information to paused
      this.game.players[side].left_at = new Date();

      this.pauseRound();

      const oppositePlayer = this.getPlayerOnSide(this.getOppositeSide(side));
      const player = this.getPlayerOnSide(side);

      // Delete the game if the player is alone in the match
      if (!oppositePlayer) {
        return { shouldDeleteGame: true, playerWin: false };
      }

      // If the other player didn't disconnect
      if (!oppositePlayer.left_at) {
        return { shouldDeleteGame: false, playerWin: false };
      }

      let timeSpendFromOtherPlayerLeft =
        oppositePlayer.left_at.getTime() - player.left_at.getTime();
      timeSpendFromOtherPlayerLeft = Math.abs(
        timeSpendFromOtherPlayerLeft / 1000,
      );

      // Delete the game when both user have left before 30sec
      if (timeSpendFromOtherPlayerLeft < 10) {
        return { shouldDeleteGame: true, playerWin: false };
      }

      return { shouldDeleteGame: true, playerWin: true };
    }

    return { shouldDeleteGame: false, playerWin: false };
  }

  public canPlayerJoin(user: User): boolean {
    if (this.isUserInMatch(user)) return true;
    if (this.is_private) return false;
    return !this.game.players.right || !this.game.players.right.connected;
  }

  public isUserInMatch(user: User): PlayerSide | null {
    if (
      this.game.players.left &&
      user.id == this.game.players.left.connected.id
    )
      return 'left';
    if (
      this.game.players.right &&
      user.id == this.game.players.right.connected.id
    )
      return 'right';
    return null;
  }

  public setUserPosition(side: PlayerSide, position: number) {
    const player = this.game.players[side];

    // Check if the last move was more than 1ms away
    if (new Date().getTime() - player.last_move.getTime() >= 1) {
      // Backup the initial player position
      const startPosition = player.position.x;

      if (
        Math.abs(player.position.x - position) <
        new Date().getTime() - player.last_move.getTime()
      ) {
        player.position.x = position;
        player.last_move = new Date();

        // Update position for clients
        if (startPosition != player.position.x)
          this.server.volatile.emit('playerMove', side, player.position.x);
      }
    }
  }

  private isPaddle(position: Position2D, player: Player): boolean {
    return (
      position.y < player.position.x + this.game.padHeight / 2 &&
      position.y > player.position.x - this.game.padHeight / 2
    );
  }
  private isPaddleTop(position: Position2D, player: Player): boolean {
    return (
      position.y > player.position.x - this.game.padHeight / 2 &&
      position.y < player.position.x - this.game.padHeight / 4
    );
  }
  private isPaddleMiddle(position: Position2D, player: Player): boolean {
    return (
      position.y >= player.position.x - this.game.padHeight / 4 &&
      position.y <= player.position.x + this.game.padHeight / 4
    );
  }
  private isPaddleBottom(position: Position2D, player: Player): boolean {
    return (
      position.y < player.position.x + this.game.padHeight / 2 &&
      position.y > player.position.x + this.game.padHeight / 4
    );
  }

  /**
   *
   * @param ball
   * @param player
   * @param side
   * @returns boolean : is the ball is in the goal side
   */
  private handlePaddleHit(
    ball: Ball,
    player: Player,
    side: PlayerSide,
  ): boolean {
    let is_ball_in_player_side = false;
    if (side == 'right') {
      is_ball_in_player_side = ball.position.x >= RIGHT_PAD_FRONT_BOUNDARY;
    } else if (side == 'left') {
      is_ball_in_player_side = ball.position.x <= LEFT_PAD_FRONT_BOUNDARY;
    }

    if (is_ball_in_player_side) {
      if (!this.isPaddle(ball.position, player)) return true;

      ball.vector.x *= -1.1;

      if (this.isPaddleMiddle(ball.position, player)) ball.vector.y *= -1.1;
      else if (this.isPaddleBottom(ball.position, player))
        ball.vector.y = Math.abs(ball.vector.x);
      else if (this.isPaddleTop(ball.position, player))
        ball.vector.y = -Math.abs(ball.vector.x);

      this.server.volatile.emit('heartbeat', this.getGame());

      return false;
    }
    return false;
  }

  private handleBallMove() {
    this.events.push(
      setInterval(
        () => {
          const ball = this.game.ball;

          //Upper&LowerBoundaries
          if (
            ball.position.y + BALL_RADIUS > GAME_HEIGHT ||
            ball.position.y - BALL_RADIUS < -GAME_HEIGHT
          ) {
            ball.vector.y *= -1;
            this.server.volatile.emit('heartbeat', this.getGame());
          }

          // paddleHitManagement For left player
          const ballInLeftGoal = this.handlePaddleHit(
            ball,
            this.game.players.left,
            'left',
          );

          // paddleHitManagement For right player
          const ballInRightGoal = this.handlePaddleHit(
            ball,
            this.game.players.right,
            'right',
          );

          if (ballInLeftGoal) {
            this.game.players.right.points += 1;
            if (this.game.players.right.points >= 5) {
              this.end();
              this.server.emit('game_over', this.getGame());
              this.eventEmitter.emitAsync(
                'game.end',
                this,
                'right',
                this.is_private,
              );
            } else {
              this.startRound();
            }
            return;
          }
          if (ballInRightGoal) {
            this.game.players.left.points += 1;
            if (this.game.players.left.points >= 5) {
              this.end();
              this.server.emit('game_over', this.getGame());
              this.eventEmitter.emitAsync(
                'game.end',
                this,
                'left',
                this.is_private,
              );
            } else {
              this.startRound();
            }
            return;
          }

          // paddleSidesHitManagement
          // Left player
          if (
            (Math.floor(ball.position.y + BALL_RADIUS) ===
              Math.floor(
                this.game.players.left.position.x - this.game.padHeight / 2,
              ) ||
              Math.floor(ball.position.y - BALL_RADIUS) ===
                Math.floor(
                  this.game.players.left.position.x + this.game.padHeight / 2,
                )) &&
            ball.position.x < LEFT_PAD_FRONT_BOUNDARY &&
            ball.position.x > LEFT_PAD_FRONT_BOUNDARY - PAD_WIDTH
          )
            ball.vector.y *= -1;
          // Right player
          if (
            (Math.floor(ball.position.y + BALL_RADIUS) ===
              Math.floor(
                this.game.players.right.position.x - this.game.padHeight / 2,
              ) ||
              Math.floor(ball.position.y - BALL_RADIUS) ===
                Math.floor(
                  this.game.players.right.position.x + this.game.padHeight / 2,
                )) &&
            ball.position.x > RIGHT_PAD_FRONT_BOUNDARY &&
            ball.position.x < RIGHT_PAD_FRONT_BOUNDARY + PAD_WIDTH
          )
            ball.vector.y *= -1;

          if (ball.vector.x > MAX_SPEED) ball.vector.x = MAX_SPEED;
          else if (ball.vector.x < -MAX_SPEED) ball.vector.x = -MAX_SPEED;

          if (ball.vector.y > MAX_SPEED) ball.vector.y = MAX_SPEED;
          else if (ball.vector.y < -MAX_SPEED) ball.vector.y = -MAX_SPEED;

          //ballPositionChange
          ball.position.x += ball.vector.x;
          ball.position.y += ball.vector.y;
          this.server.emit('ballMove', { ...ball, date: new Date() });
        },
        this.mode == 'SPECIAL' ? 2 : 4,
      ),
    );
  }

  private handleHeartBeat() {
    this.events.push(
      setInterval(() => {
        this.server.volatile.emit('heartbeat', this.getGame());
      }, 2000),
    );
  }

  private startRound(isFirstRound = false) {
    this.resetPlayersPosition();

    this.game.paused = false;

    // Set ball speed to left or right
    if (isFirstRound) {
      this.game.ball.vector.x = Math.round(Math.random()) == 1 ? 0.05 : -0.05;
    } else
      this.game.ball.vector.x = this.game.ball.position.x > 0 ? 0.05 : -0.05;

    // Set ball speed to top or bottom
    this.game.ball.vector.y = Math.random() * 0.05 - 0.05;

    this.resetBallPosition();

    this.server.emit('start', this.getGame());
  }

  private pauseRound() {
    // Stop intervals while the game is stopped
    this.end();
    this.game.paused = true;
    this.server.emit('pause', this.getGame());
  }

  private resumeRound() {
    this.game.paused = false;
    this.server.emit('resume', this.getGame());

    this.handleHeartBeat();
    this.handleBallMove();
  }

  private resetPlayersPosition() {
    this.game.players.left.position.x = 0;
    this.game.players.left.last_move = new Date();
    this.game.players.right.position.x = 0;
    this.game.players.right.last_move = new Date();

    this.server.emit('playerMove', 'left', this.game.players.left.position.x);
    this.server.emit('playerMove', 'right', this.game.players.right.position.x);
  }

  private resetBallPosition() {
    this.game.ball.position.x = 0;
    this.game.ball.position.y = 0;

    this.server.emit('ballMove', { ...this.game.ball, date: new Date() });
  }

  private getPlayerOnSide(side: PlayerSide): Player | null {
    return this.game.players[side];
  }

  public isDisconnected(side: PlayerSide) {
    if (this.game.players[side]) {
      return this.game.players[side].left_at != null;
    }
    return true;
  }

  public getOppositeSide(side: PlayerSide): PlayerSide {
    if (side == 'left') return 'right';
    return 'left';
  }

  public getDuration() {
    return Math.round(
      (new Date().getTime() - this.game.time_spent.getTime()) / 1000,
    );
  }
}
