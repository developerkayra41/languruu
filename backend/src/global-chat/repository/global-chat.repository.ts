import { Inject } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { globalMessages } from "src/_common/drizzle/global-chat";
import { GlobalMessageItem } from "src/_common/types/social.type";
import { utc } from "src/_common/utils/sql-time";

export class GlobalChatRepository {
    constructor(@Inject('DRIZZLE') private readonly db) { }

    async listRecent(userId: number, limit: number): Promise<GlobalMessageItem[]> {
        const result = await this.db.execute(sql`
            SELECT recent.id, recent.body,
                   ${utc('recent.created_at')} AS created_at,
                   ${utc('recent.edited_at')} AS edited_at,
                   (recent.user_id = ${userId}) AS from_me,
                   u.user_name, u.full_name, u.avatar_url
            FROM (
                SELECT g.id, g.body, g.created_at, g.edited_at, g.user_id
                FROM global_messages g
                JOIN users gu ON gu.id = g.user_id AND gu.deleted_at IS NULL
                ORDER BY g.created_at DESC, g.id DESC
                LIMIT ${limit}
            ) recent
            JOIN users u ON u.id = recent.user_id
            ORDER BY recent.created_at ASC, recent.id ASC
        `);
        return result.rows as GlobalMessageItem[];
    }

    async findById(messageId: number): Promise<{ id: number; user_id: number } | null> {
        const [row] = await this.db
            .select({ id: globalMessages.id, user_id: globalMessages.user_id })
            .from(globalMessages)
            .where(eq(globalMessages.id, messageId))
            .limit(1);
        return row ?? null;
    }

    async insertMessage(userId: number, body: string): Promise<GlobalMessageItem> {
        const result = await this.db.execute(sql`
            WITH inserted AS (
                INSERT INTO global_messages (user_id, body)
                VALUES (${userId}, ${body})
                RETURNING id, body, created_at, edited_at, user_id
            )
            SELECT inserted.id, inserted.body,
                   ${utc('inserted.created_at')} AS created_at,
                   ${utc('inserted.edited_at')} AS edited_at,
                   TRUE AS from_me,
                   u.user_name, u.full_name, u.avatar_url
            FROM inserted
            JOIN users u ON u.id = inserted.user_id
        `);
        return result.rows[0] as GlobalMessageItem;
    }

    async updateMessage(messageId: number, body: string): Promise<GlobalMessageItem> {
        const result = await this.db.execute(sql`
            WITH updated AS (
                UPDATE global_messages
                SET body = ${body}, edited_at = now()
                WHERE id = ${messageId}
                RETURNING id, body, created_at, edited_at, user_id
            )
            SELECT updated.id, updated.body,
                   ${utc('updated.created_at')} AS created_at,
                   ${utc('updated.edited_at')} AS edited_at,
                   TRUE AS from_me,
                   u.user_name, u.full_name, u.avatar_url
            FROM updated
            JOIN users u ON u.id = updated.user_id
        `);
        return result.rows[0] as GlobalMessageItem;
    }

    async deleteMessage(messageId: number): Promise<void> {
        await this.db.delete(globalMessages).where(eq(globalMessages.id, messageId)).execute();
    }

    async deleteOlderThan(days: number): Promise<number> {
        const result = await this.db.execute(sql`
            DELETE FROM global_messages
            WHERE created_at < now() - (${days} || ' days')::interval
            RETURNING id
        `);
        return result.rows.length;
    }
}
