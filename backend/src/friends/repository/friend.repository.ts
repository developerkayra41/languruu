import { Inject } from "@nestjs/common";
import { and, eq, or, sql } from "drizzle-orm";
import { friendships } from "src/_common/drizzle/friendships";
import { FriendRequestSummary, FriendSummary, FriendshipStatus } from "src/_common/types/social.type";
import { utc } from "src/_common/utils/sql-time";

export interface FriendshipRow {
    id: number;
    requester_id: number;
    addressee_id: number;
    status: FriendshipStatus;
    created_at: Date;
    responded_at: Date | null;
}

export class FriendRepository {
    constructor(@Inject('DRIZZLE') private readonly db) { }

    async findRelation(userIdA: number, userIdB: number): Promise<FriendshipRow | null> {
        const [row] = await this.db
            .select()
            .from(friendships)
            .where(or(
                and(eq(friendships.requester_id, userIdA), eq(friendships.addressee_id, userIdB)),
                and(eq(friendships.requester_id, userIdB), eq(friendships.addressee_id, userIdA)),
            ))
            .limit(1);
        return row ?? null;
    }

    async findById(id: number): Promise<FriendshipRow | null> {
        const [row] = await this.db.select().from(friendships).where(eq(friendships.id, id)).limit(1);
        return row ?? null;
    }

    async createRequest(requesterId: number, addresseeId: number): Promise<FriendshipRow> {
        const [row] = await this.db
            .insert(friendships)
            .values({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' })
            .returning();
        return row;
    }

    async accept(id: number): Promise<void> {
        await this.db.update(friendships)
            .set({ status: 'accepted', responded_at: new Date() })
            .where(eq(friendships.id, id))
            .execute();
    }

    async remove(id: number): Promise<void> {
        await this.db.delete(friendships).where(eq(friendships.id, id)).execute();
    }

    async listFriends(userId: number): Promise<FriendSummary[]> {
        const result = await this.db.execute(sql`
            SELECT u.id, u.user_name, u.full_name, u.avatar_url,
                   ${utc('f.responded_at')} AS friends_since
            FROM friendships f
            JOIN users u ON u.id = CASE WHEN f.requester_id = ${userId} THEN f.addressee_id ELSE f.requester_id END
            WHERE f.status = 'accepted'
              AND (f.requester_id = ${userId} OR f.addressee_id = ${userId})
              AND u.deleted_at IS NULL
            ORDER BY u.user_name ASC
        `);
        return result.rows as FriendSummary[];
    }

    async listIncomingRequests(userId: number): Promise<FriendRequestSummary[]> {
        const result = await this.db.execute(sql`
            SELECT f.id AS request_id, ${utc('f.created_at')} AS created_at,
                   u.user_name, u.full_name, u.avatar_url
            FROM friendships f
            JOIN users u ON u.id = f.requester_id
            WHERE f.addressee_id = ${userId}
              AND f.status = 'pending'
              AND u.deleted_at IS NULL
            ORDER BY f.created_at DESC
        `);
        return result.rows as FriendRequestSummary[];
    }

    async countIncomingRequests(userId: number): Promise<number> {
        const result = await this.db.execute(sql`
            SELECT count(*)::int AS count
            FROM friendships f
            JOIN users u ON u.id = f.requester_id
            WHERE f.addressee_id = ${userId}
              AND f.status = 'pending'
              AND u.deleted_at IS NULL
        `);
        return result.rows[0]?.count ?? 0;
    }

    async countFriends(userId: number): Promise<number> {
        const result = await this.db.execute(sql`
            SELECT count(*)::int AS count
            FROM friendships f
            JOIN users u ON u.id = CASE WHEN f.requester_id = ${userId} THEN f.addressee_id ELSE f.requester_id END
            WHERE f.status = 'accepted'
              AND (f.requester_id = ${userId} OR f.addressee_id = ${userId})
              AND u.deleted_at IS NULL
        `);
        return result.rows[0]?.count ?? 0;
    }

    async areFriends(userIdA: number, userIdB: number): Promise<boolean> {
        const relation = await this.findRelation(userIdA, userIdB);
        return relation?.status === 'accepted';
    }
}
