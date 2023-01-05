import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmpty, IsNumber } from 'class-validator';

export class FriendStatusDTO {
  @IsNumber()
  @IsEmpty()
  @ApiPropertyOptional({
    type: 'number',
    description:
      "Rechercher avec l'ID de l'utilisateur, le lien qu'ils ont entre eux",
  })
  friend?: number;
}
