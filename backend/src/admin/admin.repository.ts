import { Inject } from "@nestjs/common";
import { sql } from "drizzle-orm";

export class AdminRepository {
    constructor(@Inject('DRIZZLE') private readonly db) { }

    async getStats() {
        const result = await this.db.execute(sql`
            SELECT
              (SELECT count(*) FROM users WHERE deleted_at IS NULL)::int AS total_users,
              (SELECT count(*) FROM users WHERE deleted_at IS NULL AND created_at >= now() - interval '1 day')::int AS users_today,
              (SELECT count(*) FROM users WHERE deleted_at IS NULL AND created_at >= now() - interval '7 days')::int AS users_week,
              (SELECT count(*) FROM users WHERE deleted_at IS NULL AND last_seen_at >= now() - interval '15 minutes')::int AS online_now,
              (SELECT count(*) FROM market_place)::int AS shared_groups,
              (SELECT COALESCE(SUM(jsonb_array_length(w.words)),0)::int
                 FROM words w WHERE jsonb_typeof(w.words)='array') AS total_groups,
              (SELECT COALESCE(SUM(jsonb_array_length(COALESCE(col->'wordPool','[]'::jsonb))),0)::int
                 FROM words w, LATERAL jsonb_array_elements(w.words) AS col
                 WHERE w.words IS NOT NULL AND jsonb_typeof(w.words)='array') AS total_words
        `);
        return result.rows[0];
    }

    async listUsers(params: { filter?: string; search?: string; page: number; pageSize: number }) {
        const { filter, search, page, pageSize } = params;
        const like = search ? `%${search}%` : null;
        const offset = (page - 1) * pageSize;

        const filterCond =
            filter === 'online' ? sql`AND last_seen_at >= now() - interval '15 minutes'` :
                filter === 'today' ? sql`AND created_at >= now() - interval '1 day'` :
                    filter === 'week' ? sql`AND created_at >= now() - interval '7 days'` :
                        sql``;
        const searchCond = like
            ? sql`AND (user_name ILIKE ${like} OR email ILIKE ${like} OR full_name ILIKE ${like})`
            : sql``;

        const items = await this.db.execute(sql`
            SELECT id, user_name, full_name, email, created_at, is_banned, last_seen_at
            FROM users
            WHERE deleted_at IS NULL ${filterCond} ${searchCond}
            ORDER BY created_at DESC
            LIMIT ${pageSize} OFFSET ${offset}
        `);
        const totalRes = await this.db.execute(sql`
            SELECT count(*)::int AS total FROM users
            WHERE deleted_at IS NULL ${filterCond} ${searchCond}
        `);
        return { items: items.rows, total: totalRes.rows[0].total };
    }

    async getDiscoverySources() {
        const result = await this.db.execute(sql`
            SELECT COALESCE(discovery_source, 'unanswered') AS source, count(*)::int AS count
            FROM users
            WHERE deleted_at IS NULL
            GROUP BY 1
            ORDER BY count DESC
        `);
        return result.rows;
    }

    async getRecentErrors(limit = 15) {
        const result = await this.db.execute(sql`
            SELECT id, message, path, method, status, user_id, created_at
            FROM error_logs ORDER BY created_at DESC LIMIT ${limit}
        `);
        return result.rows;
    }

    async getRecentSecurityEvents(limit = 15) {
        const result = await this.db.execute(sql`
            SELECT id, event_type, user_id, email, ip_address, created_at
            FROM security_events ORDER BY created_at DESC LIMIT ${limit}
        `);
        return result.rows;
    }
}