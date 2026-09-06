import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { containsProfanityInText } from 'src/_common/moderation/profanity';
import { isAdminEmail } from 'src/_common/utils/admin-emails';
import { UserRepository } from 'src/users/repository/user.repository';
import { GlobalChatRepository } from './repository/global-chat.repository';
import { PresenceService } from 'src/_common/presence/presence.service';

export const GLOBAL_MESSAGE_TTL_DAYS = 7;
const FEED_PAGE_SIZE = 100;

@Injectable()
export class GlobalChatService {
    constructor(
        private readonly globalChatRepo: GlobalChatRepository,
        private readonly userRepo: UserRepository,
        private readonly config: ConfigService,
        private readonly presence: PresenceService,
    ) { }

    private assertClean = (body: string) => {
        if (containsProfanityInText(body)) throw new BadRequestException('PROFANITY');
    };

    private isAdmin = async (userId: number): Promise<boolean> => {
        const user = await this.userRepo.findById(userId);
        return isAdminEmail(this.config, user?.email);
    };

    list = async (userId: number) => {
        const rows = await this.globalChatRepo.listRecent(userId, FEED_PAGE_SIZE);
        const viewer = await this.presence.viewer(userId);
        const onlineIds = await this.presence.visibleIds(userId, rows.map((row) => row.user_id), viewer);

        return {
            messages: rows.map(({ user_id, ...message }) => ({
                ...message,
                is_online: onlineIds.has(user_id),
            })),
            expires_in_days: GLOBAL_MESSAGE_TTL_DAYS,
            is_moderator: viewer.is_admin,
        };
    };

    send = async (userId: number, body: string) => {
        this.assertClean(body);
        return this.globalChatRepo.insertMessage(userId, body.trim());
    };

    private ownMessage = async (userId: number, messageId: number) => {
        const message = await this.globalChatRepo.findById(messageId);
        if (!message) throw new NotFoundException('Mesaj bulunamadı.');
        if (message.user_id !== userId) {
            throw new ForbiddenException('Yalnızca kendi mesajınızı düzenleyip silebilirsiniz.');
        }
        return message;
    };

    editMessage = async (userId: number, messageId: number, body: string) => {
        this.assertClean(body);
        await this.ownMessage(userId, messageId);
        return this.globalChatRepo.updateMessage(messageId, body.trim());
    };

    deleteMessage = async (userId: number, messageId: number) => {
        const message = await this.globalChatRepo.findById(messageId);
        if (!message) throw new NotFoundException('Mesaj bulunamadı.');
        if (message.user_id !== userId && !(await this.isAdmin(userId))) {
            throw new ForbiddenException('Yalnızca kendi mesajınızı silebilirsiniz.');
        }
        await this.globalChatRepo.deleteMessage(messageId);
        return { id: messageId };
    };

    purgeExpired = async (): Promise<number> =>
        this.globalChatRepo.deleteOlderThan(GLOBAL_MESSAGE_TTL_DAYS);
}
