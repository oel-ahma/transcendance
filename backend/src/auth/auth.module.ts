import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { IntraStrategy } from './strategies/intra.strategy';
import { IntraAuthGuard } from './guards/intra.guard';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt.guard';
import { DoublefaService } from './doublefa/doublefa.service';
import { DoublefaController } from './doublefa/doublefa.controller';
import Jwt2FAGuard from './guards/jwt-2fa.guard';
import { Jwt2FAStrategy } from './strategies/jwt_2fa.strategy';

@Module({
  imports: [PrismaModule, HttpModule, ConfigModule, JwtModule],
  providers: [
    AuthService,
    IntraStrategy,
    JwtStrategy,
    Jwt2FAStrategy,
    IntraAuthGuard,
    JwtAuthGuard,
    Jwt2FAGuard,
    DoublefaService,
  ],
  controllers: [AuthController, DoublefaController],
})
export class AuthModule {}
