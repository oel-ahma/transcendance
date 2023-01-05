import { ApiProperty } from '@nestjs/swagger';

export default class ResponseLoginDTO {
  @ApiProperty({
    type: 'string',
  })
  access_token: string;

  @ApiProperty({
    type: 'boolean',
    default: false,
    description: "Est-ce que l'utilisateur doit s'authentifier",
  })
  '2fa_needed': boolean;
}
