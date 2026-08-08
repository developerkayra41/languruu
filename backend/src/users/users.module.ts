import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DrizzleModule } from 'src/_common/drizzle/drizzle.module';
import { UserRepository } from './repository/user.repository';
import { WordRepository } from 'src/words/repository/words.repository';
import { TopPerformerRepository } from 'src/top-performers/repository/top-performers.repository';
import { SupabaseModule } from 'src/_common/supabase/supabase.module';
import { WordsModule } from 'src/words/words.module';
import { AuthModule } from 'src/auth/auth.module';
import { MailModule } from 'src/mail/mail.module';
import { MailService } from 'src/mail/mail.service';
import { UserCleanupTasks } from './tasks/user-cleanup.tasks';

// users.module.ts
@Module({
  imports: [DrizzleModule, SupabaseModule, WordsModule, MailModule, forwardRef(() => AuthModule)],
  providers: [UsersService, UserRepository, TopPerformerRepository, MailService, UserCleanupTasks],
  controllers: [UsersController],
  exports: [UsersService, UserRepository]   // <- UserRepository eklendi
})
export class UsersModule { }