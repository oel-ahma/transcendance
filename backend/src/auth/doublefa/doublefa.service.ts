import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { authenticator } from 'otplib';
import { UserService } from 'src/prisma/user/user.service';
import { toFileStream } from 'qrcode';
import { Response } from 'express';

authenticator.options = {
  window: 3,
}

@Injectable()
export class DoublefaService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async generateTwoFASecret(user: User) {
    const secret = authenticator.generateSecret();
    const url = authenticator.keyuri(user.name, 'Transcendance', secret);
    await this.userService.setTwoFASecret(secret, user.id);

    return {
      secret,
      url,
    };
  }

  async pipeQrCodeStream(stream: Response, url: string) {
    stream.setHeader('Content-type', 'image/png');
    return toFileStream(stream, url);
  }

  async isTwoFAValid(code: string, user: User): Promise<boolean> {
    if (!user.otp_secret)
      throw new InternalServerErrorException(null, 'No OTP generated before.');
    return authenticator.verify({
      token: code,
      secret: user.otp_secret,
    });
  }
}
