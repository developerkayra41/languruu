import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/_common/drizzle/drizzle.module';
import { FriendRepository } from 'src/friends/repository/friend.repository';
import { UserRepository } from 'src/users/repository/user.repository';
import { PresenceService } from './presence.service';

@Module({
    imports: [DrizzleModule],
    providers: [PresenceService, UserRepository, FriendRepository],
    exports: [PresenceService],
})
export class PresenceModule { }
