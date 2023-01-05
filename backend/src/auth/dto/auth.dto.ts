import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export default class AuthDTO {
  @ApiPropertyOptional({
    type: 'string',
    description: "Le code renvoyé par l'API de l'Intra",
  })
  @IsString()
  code: string;
}
