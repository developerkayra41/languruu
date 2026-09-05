import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { containsProfanityInText } from 'src/_common/moderation/profanity';
import { isAdminEmail } from 'src/_common/utils/admin-emails';
import { UserRepository } from 'src/users/repository/user.repository';
import { GlobalChatRepository } from './repository/global-chat.repository';

export const GLOBAL_MESSAGE_TTL_DAYS = 7;
const FEED_PAGE_SIZE = 100;

@Injectable()
export class GlobalChatService {
    constructor(
        private readonly globalChatRepo: GlobalChatRepository,
        private readonly userRepo: UserRepository,
        private readonly config: ConfigService,
    ) { }

    private assertClean = (body: string) => {
        if (containsProfanityInText(body)) throw new BadRequestException('PROFANITY');
    };

    private isAdmin = async (userId: number): Promise<boolean> => {
        const user = await this.userRepo.findById(userId);
        return isAdminEmail(this.config, user?.email);
    };

    list = async (userId: number) => ({
        messages: await this.globalChatRepo.listRecent(userId, FEED_PAGE_SIZE),
        expires_in_days: GLOBAL_MESSAGE_TTL_DAYS,
        is_moderator: await this.isAdmin(userId),
    });

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
