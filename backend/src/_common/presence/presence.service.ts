import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FriendRepository } from 'src/friends/repository/friend.repository';
import { UserRepository } from 'src/users/repository/user.repository';
import { isAdminEmail } from 'src/_common/utils/admin-emails';
import { canSeePresence, PresenceSubject, PresenceViewer } from 'src/_common/utils/presence';

@Injectable()
export class PresenceService {
    constructor(
        private readonly userRepo: UserRepository,
        private readonly friendRepo: FriendRepository,
        private readonly config: ConfigService,
    ) { }

    viewer = async (userId: number): Promise<PresenceViewer> => {
        const [user, friendIds] = await Promise.all([
            this.userRepo.findById(userId),
            this.friendRepo.listFriendIds(userId),
        ]);
        return {
            id: userId,
            is_admin: isAdminEmail(this.config, user?.email),
            friend_ids: new Set(friendIds),
        };
    };

    canSee = async (viewerId: number, subject: PresenceSubject): Promise<boolean> => {
        if (subject.user_id === viewerId) subject = { ...subject, online: true };
        if (!subject.online) return false;
        return canSeePresence(subject, await this.viewer(viewerId));
    };

    visibleIds = async (viewerId: number, userIds: number[], prepared?: PresenceViewer): Promise<Set<number>> => {
        const ids = [...new Set(userIds)];
        if (ids.length === 0) return new Set();

        const subjects = (await this.userRepo.listPresence(ids)).map((row) =>
            row.user_id === viewerId ? { ...row, online: true } : row,
        );
        if (!subjects.some((row) => row.online)) return new Set();

        const viewer = prepared ?? (await this.viewer(viewerId));
        return new Set(subjects.filter((row) => canSeePresence(row, viewer)).map((row) => row.user_id));
    };
}
