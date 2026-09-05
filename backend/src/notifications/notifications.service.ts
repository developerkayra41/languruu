import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './repository/notification.repository';
import { CreateNotification } from 'src/_common/types/social.type';

const MAX_PAGE_SIZE = 30;

@Injectable()
export class NotificationsService {
    constructor(private readonly notificationRepo: NotificationRepository) { }

    create = async (data: CreateNotification): Promise<void> => {
        if (data.actor_user_id && data.actor_user_id === data.user_id) return;
        await this.notificationRepo.create(data);
    };

    list = async (userId: number, limit = MAX_PAGE_SIZE, offset = 0) => {
        const size = Math.min(Math.max(limit, 1), MAX_PAGE_SIZE);
        const [items, unreadCount] = await Promise.all([
            this.notificationRepo.list(userId, size, Math.max(offset, 0)),
            this.notificationRepo.countUnread(userId),
        ]);
        return { items, unread_count: unreadCount, has_more: items.length === size };
    };

    unreadCount = async (userId: number) => ({ count: await this.notificationRepo.countUnread(userId) });

    markRead = async (userId: number, id: number) => {
        await this.notificationRepo.markRead(userId, id);
        return this.unreadCount(userId);
    };

    markAllRead = async (userId: number) => {
        await this.notificationRepo.markAllRead(userId);
        return { count: 0 };
    };

    notifyMessage = async (userId: number, actorUserId: number): Promise<void> => {
        if (userId === actorUserId) return;
        await this.notificationRepo.upsertMessageNotification(userId, actorUserId);
    };

    readMessageNotification = async (userId: number, actorUserId: number): Promise<void> => {
        await this.notificationRepo.markMessageNotificationRead(userId, actorUserId);
    };

    consumeFriendRequest = async (requestId: number): Promise<void> => {
        await this.notificationRepo.removeFriendRequestNotification(requestId);
    };

    clearPair = async (userIdA: number, userIdB: number): Promise<void> => {
        await this.notificationRepo.removeForPair(userIdA, userIdB);
    };
}
