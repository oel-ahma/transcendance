import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Strategy } from 'passport-oauth2';
import { HttpService } from '@nestjs/axios';
import { stringify } from 'querystring';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IntraStrategy extends PassportStrategy(Strategy, 'intra') {
  constructor(
    private authService: AuthService,
    private http: HttpService,
    private readonly configService: ConfigService,
  ) {
    super({
      authorizationURL: `https://api.intra.42.fr/oauth/authorize?${stringify({
        client_id: configService.get('INTRA_OAUTH2_ID'),
        redirect_uri: configService.get('INTRA_OAUTH2_SECRET'),
        response_type: 'code',
        scope: 'public',
      })}`,
      tokenURL: 'https://api.intra.42.fr/oauth/token',
      scope: 'public',
      clientID: configService.get('INTRA_OAUTH2_ID'),
      clientSecret: configService.get('INTRA_OAUTH2_SECRET'),
      callbackURL: configService.get('INTRA_OAUTH2_CALLBACKURL'),
    });
  }

  async validate(accessToken: string): Promise<any> {
    const { data } = await this.http
      .get('https://api.intra.42.fr/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .toPromise();
    if (!data) throw new UnauthorizedException();
    return this.authService.retrieveUserFromToken(data);
  }
}
