import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/prisma/user/user.service';
import { User } from '@prisma/client';

@Injectable()
export class Jwt2FAStrategy extends PassportStrategy(Strategy, 'jwt-2fa') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload): Promise<User> {
    const user = await this.userService.user({
      id: payload.sub,
    });
    if (!user)
      throw new HttpException('Need login with 2FA', HttpStatus.UNAUTHORIZED);
    if (!user.otp_enable) return user;
    if (payload.doublefa) return user;
    throw new HttpException('Need login with 2FA', HttpStatus.UNAUTHORIZED);
  }
}
