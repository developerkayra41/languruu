import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MessageRepository } from './repository/message.repository';
import { FriendRepository } from 'src/friends/repository/friend.repository';
import { UserRepository } from 'src/users/repository/user.repository';
import { NotificationsService } from 'src/notifications/notifications.service';

export const MESSAGE_TTL_DAYS = 7;
const THREAD_PAGE_SIZE = 100;

@Injectable()
export class MessagesService {
    constructor(
        private readonly messageRepo: MessageRepository,
        private readonly friendRepo: FriendRepository,
        private readonly userRepo: UserRepository,
        private readonly notificationsService: NotificationsService,
    ) { }

    private resolveFriend = async (userId: number, userName: string) => {
        const target = await this.userRepo.findByUsernamePublic(userName);
        if (!target) throw new NotFoundException('Kullanıcı bulunamadı.');
        if (target.id === userId) throw new ForbiddenException('Kendinize mesaj gönderemezsiniz.');
        if (!(await this.friendRepo.areFriends(userId, target.id))) {
            throw new ForbiddenException('NOT_FRIENDS');
        }
        return target;
    };

    listConversations = async (userId: number) => this.messageRepo.listConversations(userId);

    unreadSummary = async (userId: number) => ({
        unread_senders: await this.messageRepo.countUnreadSenders(userId),
    });

    getThread = async (userId: number, userName: string) => {
        const target = await this.resolveFriend(userId, userName);
        const conversation = await this.messageRepo.findConversation(userId, target.id);

        if (!conversation) {
            return {
                peer: {
                    user_name: target.user_name,
                    full_name: target.full_name,
                    avatar_url: target.avatar_url ?? null,
                },
                messages: [],
                expires_in_days: MESSAGE_TTL_DAYS,
            };
        }

        const items = await this.messageRepo.listMessages(conversation.id, userId, THREAD_PAGE_SIZE);
        await this.messageRepo.markRead(conversation.id, userId, conversation.user_a_id === userId);
        await this.notificationsService.readMessageNotification(userId, target.id);

        return {
            peer: {
                user_name: target.user_name,
                full_name: target.full_name,
                avatar_url: target.avatar_url ?? null,
            },
            messages: items,
            expires_in_days: MESSAGE_TTL_DAYS,
        };
    };

    send = async (userId: number, userName: string, body: string) => {
        const target = await this.resolveFriend(userId, userName);
        const conversation = await this.messageRepo.findOrCreateConversation(userId, target.id);

        const message = await this.messageRepo.insertMessage(conversation.id, userId, body.trim());
        await this.messageRepo.markRead(conversation.id, userId, conversation.user_a_id === userId);
        await this.notificationsService.notifyMessage(target.id, userId);

        return message;
    };

    private ownMessage = async (userId: number, messageId: number) => {
        const message = await this.messageRepo.findMessageWithConversation(messageId);
        if (!message) throw new NotFoundException('Mesaj bulunamadı.');
        if (message.sender_id !== userId) {
            throw new ForbiddenException('Yalnızca kendi mesajınızı düzenleyip silebilirsiniz.');
        }
        return message;
    };

    editMessage = async (userId: number, messageId: number, body: string) => {
        await this.ownMessage(userId, messageId);
        return this.messageRepo.updateMessage(messageId, body.trim());
    };

    deleteMessage = async (userId: number, messageId: number) => {
        await this.ownMessage(userId, messageId);
        await this.messageRepo.deleteMessage(messageId);
        return { id: messageId };
    };

    purgeExpired = async (): Promise<number> => this.messageRepo.deleteOlderThan(MESSAGE_TTL_DAYS);
}
