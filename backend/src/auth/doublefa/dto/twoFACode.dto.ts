import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TwoFACode {
  @ApiProperty({
    type: 'string',
    description: "Le code à 6 chiffres de l'utilisateur",
  })
  @IsString()
  code: string;
}
