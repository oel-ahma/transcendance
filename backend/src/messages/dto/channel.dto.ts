import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelType, ChannelUserStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class ChannelDTO {
  @IsString()
  @MinLength(5)
  @MaxLength(30)
  @ApiProperty({
    example: 'Nom de channel',
  })
  name: string;

  @IsEnum(ChannelType)
  @ApiProperty({
    example: ChannelType.PUBLIC,
    enum: ChannelType,
  })
  type: ChannelType;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @ValidateIf((o) => o.type == ChannelType.PROTECTED)
  @ApiPropertyOptional({
    required: false,
    description: 'Nécessaire si le channel est protégé',
  })
  password: string;
}

export class ChannelPasswordDTO {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    required: false,
    description: 'Nécessaire si le channel est protégé',
  })
  password: string;
}

export class UserRoleDTO {
  @IsNumber()
  @ApiProperty({
    example: 1,
    description: "L'ID de l'utilisateur",
    required: true,
  })
  userID: number;

  @IsEnum(ChannelUserStatus)
  @ApiProperty({
    example: ChannelUserStatus.MODERATOR,
    enum: ChannelUserStatus,
    required: true,
  })
  role: ChannelUserStatus;

  @IsDateString()
  @ValidateIf(
    (o) => o.role == ChannelUserStatus.BAN || o.role == ChannelUserStatus.MUTE,
  )
  @ApiPropertyOptional({
    required: false,
    description: 'Date à laquelle se finit la punission',
  })
  until: string;
}

export class ChannelMessageDTO {
  @IsNumber()
  @ApiPropertyOptional({
    description: 'Message à partir duquel il faut commencer la sélection',
    type: 'int32',
    examples: [0, 10, 20, 50, 100],
    default: 0,
    minimum: 0,
  })
  start = 0;

  @IsNumber()
  @ApiPropertyOptional({
    description: 'Nombre de messages à prendre',
    type: 'int32',
    examples: [1, 10, 100],
    minimum: 1,
    maximum: 100,
  })
  count = 100;
}
