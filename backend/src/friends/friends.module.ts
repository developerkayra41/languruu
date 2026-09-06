import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/_common/drizzle/drizzle.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UsersModule } from 'src/users/users.module';
import { PresenceModule } from 'src/_common/presence/presence.module';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { FriendRepository } from './repository/friend.repository';

@Module({
  imports: [DrizzleModule, UsersModule, NotificationsModule, PresenceModule],
  controllers: [FriendsController],
  providers: [FriendsService, FriendRepository],
  exports: [FriendsService, FriendRepository],
})
export class FriendsModule { }
