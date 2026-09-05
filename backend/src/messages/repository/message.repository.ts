import { Inject } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { conversations, messages } from "src/_common/drizzle/messages";
import { ConversationSummary, MessageItem } from "src/_common/types/social.type";
import { utc } from "src/_common/utils/sql-time";

export interface ConversationRow {
    id: number;
    user_a_id: number;
    user_b_id: number;
    a_last_read_at: Date | null;
    b_last_read_at: Date | null;
    last_message_at: Date | null;
}

const FRIENDSHIP_JOIN = sql`
    JOIN friendships f ON f.status = 'accepted'
      AND ((f.requester_id = c.user_a_id AND f.addressee_id = c.user_b_id)
        OR (f.requester_id = c.user_b_id AND f.addressee_id = c.user_a_id))
`;

export class MessageRepository {
    constructor(@Inject('DRIZZLE') private readonly db) { }

    private pair = (userIdA: number, userIdB: number) =>
        userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];

    async findConversation(userIdA: number, userIdB: number): Promise<ConversationRow | null> {
        const [low, high] = this.pair(userIdA, userIdB);
        const [row] = await this.db
            .select()
            .from(conversations)
            .where(and(eq(conversations.user_a_id, low), eq(conversations.user_b_id, high)))
            .limit(1);
        return row ?? null;
    }

    async findOrCreateConversation(userIdA: number, userIdB: number): Promise<ConversationRow> {
        const existing = await this.findConversation(userIdA, userIdB);
        if (existing) return existing;

        const [low, high] = this.pair(userIdA, userIdB);
        await this.db
            .insert(conversations)
            .values({ user_a_id: low, user_b_id: high })
            .onConflictDoNothing()
            .execute();

        const created = await this.findConversation(userIdA, userIdB);
        if (!created) throw new Error('Konuşma oluşturulamadı.');
        return created;
    }

    async insertMessage(conversationId: number, senderId: number, body: string): Promise<MessageItem> {
        const [row] = await this.db
            .insert(messages)
            .values({ conversation_id: conversationId, sender_id: senderId, body })
            .returning();

        await this.db
            .update(conversations)
            .set({ last_message_at: row.created_at })
            .where(eq(conversations.id, conversationId))
            .execute();

        return {
            id: row.id,
            body: row.body,
            created_at: row.created_at,
            edited_at: null,
            from_me: true,
        };
    }

    async listMessages(conversationId: number, userId: number, limit: number): Promise<MessageItem[]> {
        const result = await this.db.execute(sql`
            SELECT id, body,
                   ${utc('created_at')} AS created_at,
                   ${utc('edited_at')} AS edited_at,
                   (sender_id = ${userId}) AS from_me
            FROM (
                SELECT id, body, created_at, edited_at, sender_id
                FROM messages
                WHERE conversation_id = ${conversationId}
                ORDER BY created_at DESC, id DESC
                LIMIT ${limit}
            ) recent
            ORDER BY created_at ASC, id ASC
        `);
        return result.rows as MessageItem[];
    }

    async findMessageWithConversation(messageId: number) {
        const result = await this.db.execute(sql`
            SELECT m.id, m.sender_id, c.id AS conversation_id, c.user_a_id, c.user_b_id
            FROM messages m
            JOIN conversations c ON c.id = m.conversation_id
            WHERE m.id = ${messageId}
            LIMIT 1
        `);
        return (result.rows[0] as {
            id: number;
            sender_id: number;
            conversation_id: number;
            user_a_id: number;
            user_b_id: number;
        }) ?? null;
    }

    async updateMessage(messageId: number, body: string): Promise<MessageItem> {
        const result = await this.db.execute(sql`
            UPDATE messages
            SET body = ${body}, edited_at = now()
            WHERE id = ${messageId}
            RETURNING id, body,
                      created_at AT TIME ZONE 'UTC' AS created_at,
                      edited_at AT TIME ZONE 'UTC' AS edited_at
        `);
        return { ...(result.rows[0] as Omit<MessageItem, 'from_me'>), from_me: true };
    }

    async deleteMessage(messageId: number): Promise<void> {
        await this.db.delete(messages).where(eq(messages.id, messageId)).execute();
    }

    async markRead(conversationId: number, userId: number, isUserA: boolean): Promise<void> {
        await this.db.execute(isUserA
            ? sql`UPDATE conversations SET a_last_read_at = now() WHERE id = ${conversationId}`
            : sql`UPDATE conversations SET b_last_read_at = now() WHERE id = ${conversationId}`);
    }

    async listConversations(userId: number): Promise<ConversationSummary[]> {
        const result = await this.db.execute(sql`
            SELECT c.id AS conversation_id,
                   u.user_name, u.full_name, u.avatar_url,
                   last.body AS last_body,
                   ${utc('last.created_at')} AS last_message_at,
                   (last.sender_id = ${userId}) AS last_from_me,
                   EXISTS (
                       SELECT 1 FROM messages m
                       WHERE m.conversation_id = c.id
                         AND m.sender_id <> ${userId}
                         AND m.created_at > COALESCE(
                             CASE WHEN c.user_a_id = ${userId} THEN c.a_last_read_at ELSE c.b_last_read_at END,
                             TIMESTAMP '-infinity')
                   ) AS unread
            FROM conversations c
            JOIN users u ON u.id = CASE WHEN c.user_a_id = ${userId} THEN c.user_b_id ELSE c.user_a_id END
            ${FRIENDSHIP_JOIN}
            JOIN LATERAL (
                SELECT body, sender_id, created_at
                FROM messages m
                WHERE m.conversation_id = c.id
                ORDER BY m.created_at DESC, m.id DESC
                LIMIT 1
            ) last ON TRUE
            WHERE (c.user_a_id = ${userId} OR c.user_b_id = ${userId})
              AND u.deleted_at IS NULL
            ORDER BY last.created_at DESC
        `);
        return result.rows as ConversationSummary[];
    }

    async countUnreadSenders(userId: number): Promise<number> {
        const result = await this.db.execute(sql`
            SELECT count(DISTINCT c.id)::int AS count
            FROM conversations c
            JOIN messages m ON m.conversation_id = c.id
            JOIN users u ON u.id = CASE WHEN c.user_a_id = ${userId} THEN c.user_b_id ELSE c.user_a_id END
            ${FRIENDSHIP_JOIN}
            WHERE (c.user_a_id = ${userId} OR c.user_b_id = ${userId})
              AND u.deleted_at IS NULL
              AND m.sender_id <> ${userId}
              AND m.created_at > COALESCE(
                  CASE WHEN c.user_a_id = ${userId} THEN c.a_last_read_at ELSE c.b_last_read_at END,
                  TIMESTAMP '-infinity')
        `);
        return result.rows[0]?.count ?? 0;
    }

    async deleteOlderThan(days: number): Promise<number> {
        const result = await this.db.execute(sql`
            DELETE FROM messages
            WHERE created_at < now() - (${days} || ' days')::interval
            RETURNING id
        `);
        return result.rows.length;
    }
}
