import { Inject } from "@nestjs/common";
import { and, eq, isNull, sql } from "drizzle-orm";
import { notifications } from "src/_common/drizzle/notifications";
import { CreateNotification, NotificationItem } from "src/_common/types/social.type";
import { utc } from "src/_common/utils/sql-time";

export class NotificationRepository {
    constructor(@Inject('DRIZZLE') private readonly db) { }

    async create(data: CreateNotification): Promise<void> {
        await this.db.insert(notifications).values({
            user_id: data.user_id,
            actor_user_id: data.actor_user_id ?? null,
            type: data.type,
            payload: data.payload ?? null,
        }).execute();
    }

    async list(userId: number, limit: number, offset: number): Promise<NotificationItem[]> {
        const result = await this.db.execute(sql`
            SELECT n.id, n.type, n.payload,
                   ${utc('n.read_at')} AS read_at,
                   ${utc('n.created_at')} AS created_at,
                   u.user_name AS actor_user_name,
                   u.full_name AS actor_full_name,
                   u.avatar_url AS actor_avatar_url
            FROM notifications n
            LEFT JOIN users u ON u.id = n.actor_user_id AND u.deleted_at IS NULL
            WHERE n.user_id = ${userId}
            ORDER BY n.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `);
        return result.rows as NotificationItem[];
    }

    async countUnread(userId: number): Promise<number> {
        const [row] = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(notifications)
            .where(and(eq(notifications.user_id, userId), isNull(notifications.read_at)));
        return row?.count ?? 0;
    }

    async markRead(userId: number, id: number): Promise<void> {
        await this.db.update(notifications)
            .set({ read_at: new Date() })
            .where(and(
                eq(notifications.id, id),
                eq(notifications.user_id, userId),
                isNull(notifications.read_at),
            ))
            .execute();
    }

    async markAllRead(userId: number): Promise<void> {
        await this.db.update(notifications)
            .set({ read_at: new Date() })
            .where(and(eq(notifications.user_id, userId), isNull(notifications.read_at)))
            .execute();
    }

    async removeFriendRequestNotification(requestId: number): Promise<void> {
        await this.db.execute(sql`
            DELETE FROM notifications
            WHERE type = 'friend_request'
              AND (payload ->> 'request_id')::int = ${requestId}
        `);
    }

    async upsertMessageNotification(userId: number, actorUserId: number): Promise<void> {
        const result = await this.db.execute(sql`
            UPDATE notifications
            SET created_at = now()
            WHERE user_id = ${userId}
              AND actor_user_id = ${actorUserId}
              AND type = 'message_received'
              AND read_at IS NULL
            RETURNING id
        `);
        if (result.rows.length > 0) return;

        await this.db.insert(notifications).values({
            user_id: userId,
            actor_user_id: actorUserId,
            type: 'message_received',
            payload: null,
        }).execute();
    }

    async markMessageNotificationRead(userId: number, actorUserId: number): Promise<void> {
        await this.db.execute(sql`
            UPDATE notifications
            SET read_at = now()
            WHERE user_id = ${userId}
              AND actor_user_id = ${actorUserId}
              AND type = 'message_received'
              AND read_at IS NULL
        `);
    }

    async removeForPair(userIdA: number, userIdB: number): Promise<void> {
        await this.db.execute(sql`
            DELETE FROM notifications
            WHERE type IN ('friend_request', 'friend_accepted')
              AND ((user_id = ${userIdA} AND actor_user_id = ${userIdB})
                OR (user_id = ${userIdB} AND actor_user_id = ${userIdA}))
        `);
    }
}
