import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import Jwt2FAGuard from 'src/auth/guards/jwt-2fa.guard';
import { GameGateway } from './game.gateway';
import { GameService } from 'src/prisma/game/game.service';
import { UserService } from 'src/prisma/user/user.service';

@Controller('game')
@ApiSecurity('access-token')
@ApiTags('Jeu')
@UseGuards(Jwt2FAGuard)
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly userService: UserService,
    private readonly gameGateway: GameGateway,
  ) {}

  @Get('/')
  @ApiOperation({
    summary:
      'Recuperer toutes les parties dont le joueur a fait partie (trie par ordre de la plus recente a la plus vieille',
  })
  async getGames(@Req() req) {
    return await this.userService.games(req.user);
  }

  @Get('/current')
  @ApiOperation({
    summary:
      "Récupérer les informations d'une partie où le joueur est connecté",
  })
  @ApiOkResponse({
    description: 'Le joueur est entrain de jouer sur une partie.',
  })
  @ApiNotFoundResponse({
    description: "Le joueur n'a aucune partie en cours.",
  })
  async getCurrentGame(@Req() req) {
    const game = this.gameGateway.getUserGame(req.user);

    if (!game) return false;
    return game.id;
  }

  @Get('/player/{user_id}')
  @ApiOperation({
    summary: "Récupérer les informations d'une partie d'un autre joueur",
  })
  @ApiOkResponse({
    description: 'Le joueur est entrain de jouer sur une partie.',
  })
  @ApiNotFoundResponse({
    description: "Le joueur n'a aucune partie en cours.",
  })
  async getUserGame(
    @Req() req,
    @Param('user_id', ParseIntPipe) userid: number,
  ) {
    const user = await this.userService.user({
      id: userid,
    });
    if (!user) throw new NotFoundException();

    const game = this.gameGateway.getUserGame(user);
    if (!game) throw new NotFoundException();

    return game.id;
  }

  @Get('/game/{id}')
  @ApiOperation({
    summary: "Récupérer les informations d'une partie d'un autre joueur",
  })
  @ApiOkResponse({
    description: 'Le joueur est entrain de jouer sur une partie.',
  })
  @ApiNotFoundResponse({
    description: "Le joueur n'a aucune partie en cours.",
  })
  async getGame(@Req() req, @Param('id') game_id: string) {
    const game = this.gameGateway.getGame(game_id);
    if (!game) throw new NotFoundException();

    return game;
  }
}
