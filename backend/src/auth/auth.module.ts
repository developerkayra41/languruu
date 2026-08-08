import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserSessionRepository } from './repository/user-session.repository';
import { DrizzleModule } from 'src/_common/drizzle/drizzle.module';
import { SecurityEventRepository } from './repository/security-event.repository';
import { MailModule } from 'src/mail/mail.module';
import { MailService } from 'src/mail/mail.service';
import { AuthTokenRepository } from './repository/auth-token.repository';

@Module({
  imports: [DrizzleModule, forwardRef(() => UsersModule), MailModule, JwtModule.registerAsync({
    global: true,
    inject: [ConfigService],
    useFactory: (config: ConfigService): JwtModuleOptions => {
      const secret = config.get<string>('jwt.JWT_SECRET');
      if (!secret) {
        throw new Error('JWT_SECRET tanımlı değil. .env dosyanı kontrol et.');
      }
      return {
        secret,
        signOptions: {
          expiresIn: config.get<string>('jwt.JWT_ACCESS_EXPIRES_IN'),
        } as JwtModuleOptions['signOptions'],
      };
    },
  })],
  providers: [AuthService, UserSessionRepository, SecurityEventRepository, MailService, AuthTokenRepository],
  controllers: [AuthController],
  exports: [SecurityEventRepository, AuthTokenRepository, UserSessionRepository]


})
export class AuthModule { }
