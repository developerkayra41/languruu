import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/_common/drizzle/drizzle.module';
import { UsersModule } from 'src/users/users.module';
import { GlobalChatController } from './global-chat.controller';
import { GlobalChatService } from './global-chat.service';
import { GlobalChatRepository } from './repository/global-chat.repository';
import { GlobalChatCleanupTasks } from './tasks/global-chat-cleanup.tasks';

@Module({
  imports: [DrizzleModule, UsersModule],
  controllers: [GlobalChatController],
  providers: [GlobalChatService, GlobalChatRepository, GlobalChatCleanupTasks],
  exports: [GlobalChatService],
})
export class GlobalChatModule { }
