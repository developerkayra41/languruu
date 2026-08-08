import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfig, DatabaseConfig, JwtConfig, MailConfig } from './_config';
import { DrizzleModule } from './_common/drizzle/drizzle.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { WordsModule } from './words/words.module';
import { TopPerformersModule } from './top-performers/top-performers.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SupabaseModule } from './_common/supabase/supabase.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './_common/exceptions/http.exception.filter';
import { ErrorLogRepository } from './_common/exceptions/error-log.repository';
import { CustomThrottlerGuard } from './_common/guards/custom-throttler.guard';
import { MailModule } from './mail/mail.module';
import { MailService } from './mail/mail.service';
import { HealthController } from './health/health.controller';
import { AdminModule } from './admin/admin.module';
import { PresenceInterceptor } from './_common/interceptors/presence.interceptor';
import { ReportsModule } from './reports/reports.module';
import { AuthStateModule } from './_common/auth-state/auth-state.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    AuthModule,
    ScheduleModule.forRoot(),
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [DatabaseConfig, JwtConfig, AppConfig, MailConfig]
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 100 }]
    }),
    DrizzleModule,
    MarketplaceModule,
    WordsModule,
    TopPerformersModule,
    SupabaseModule,
    MailModule,
    AdminModule,
    ReportsModule,
    AuthStateModule 
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: CustomThrottlerGuard },
  { provide: APP_FILTER, useClass: HttpExceptionFilter },
  { provide: APP_INTERCEPTOR, useClass: PresenceInterceptor },
    ErrorLogRepository, MailService
  ],
})
export class AppModule { }
