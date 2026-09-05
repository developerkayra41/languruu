import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/_common/drizzle/drizzle.module';
import { FriendsModule } from 'src/friends/friends.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UsersModule } from 'src/users/users.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessageRepository } from './repository/message.repository';
import { MessageCleanupTasks } from './tasks/message-cleanup.tasks';

@Module({
  imports: [DrizzleModule, UsersModule, FriendsModule, NotificationsModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessageRepository, MessageCleanupTasks],
  exports: [MessagesService, MessageRepository],
})
export class MessagesModule { }
