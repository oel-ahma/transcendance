import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class EditProfileDTO {
  @IsString()
  @ApiProperty({
    name: 'name',
    description: "Nouveau nom de l'uilisateur",
    example: 'pleveque',
  })
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({
    name: 'avatar',
    description: "Nouvelle image de profile de l'utilisateur",
    type: 'file',
  })
  avatar;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    name: 'otp_enable',
    description: "Etat du 2FA pour l'utilisateur",
  })
  @Transform(({ value }) => {
    return value === 'true' || value === true || value === 1 || value === '1';
  })
  otp_enable: boolean;
}
