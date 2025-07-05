import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { InvitationService } from './invitation.service';
import { User, Invitation, MagicLink, Actor, KeyPair } from '../../entities';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from '../mail/mail.module';
import { FederationModule } from '../federation/federation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Invitation, MagicLink, Actor, KeyPair]),
    PassportModule,
    MailModule,
    FederationModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, InvitationService, JwtStrategy],
  exports: [AuthService, InvitationService],
})
export class AuthModule {}
