import { CanActivate, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Injectable()
export class LocalEnvGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(): boolean | Promise<boolean> | Observable<boolean> {
    if (this.configService.get('ENV') == 'local') return true;
    return false;
  }
}
