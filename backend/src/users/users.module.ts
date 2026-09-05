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
import { FriendRepository } from 'src/friends/repository/friend.repository';
import { NotificationRepository } from 'src/notifications/repository/notification.repository';
import { MessageRepository } from 'src/messages/repository/message.repository';

@Module({
  imports: [DrizzleModule, SupabaseModule, WordsModule, MailModule, forwardRef(() => AuthModule)],
  providers: [UsersService, UserRepository, TopPerformerRepository, MailService, UserCleanupTasks, FriendRepository, NotificationRepository, MessageRepository],
  controllers: [UsersController],
  exports: [UsersService, UserRepository]
})
export class UsersModule { }