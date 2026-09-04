import { Inject } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { TopPerformers } from "src/_common/drizzle/top-performers";
import { TopPerformerData, TopPerformerRow } from "src/_common/types/top-performers.type";

export interface RankingRow {
    user_id: number;
    full_name: string | null;
    user_name: string | null;
    avatar_url: string | null;
    effective_streak: number;
    completed_rounds: number;
    xp: number;
    total_word: number;
    pool_count: number;
}

export class TopPerformerRepository {
    constructor(@Inject('DRIZZLE') private readonly db) { }

    async computeRanking(limit: number): Promise<RankingRow[]> {
        const result = await this.db.execute(sql`
            SELECT
                u.id AS user_id,
                u.full_name,
                u.user_name,
                u.avatar_url,
                CASE WHEN u.last_study_date >= CURRENT_DATE - 1
                     THEN u.study_streak ELSE 0 END AS effective_streak,
                u.completed_rounds,
                u.xp,
                COALESCE(w.total_word, 0) AS total_word,
                COALESCE(w.pool_count, 0) AS pool_count
            FROM users u
            LEFT JOIN (
                SELECT
                    words.user_id,
                    jsonb_array_length(words.words) AS pool_count,
                    COALESCE((
                        SELECT SUM(jsonb_array_length(COALESCE(col->'wordPool', '[]'::jsonb)))
                        FROM jsonb_array_elements(words.words) AS col
                    ), 0)::int AS total_word
                FROM words
                WHERE words.words IS NOT NULL AND jsonb_typeof(words.words) = 'array'
            ) w ON w.user_id = u.id
            WHERE u.deleted_at IS NULL AND u.is_banned = false
            ORDER BY u.xp DESC, effective_streak DESC, u.completed_rounds DESC, total_word DESC, pool_count DESC, u.id ASC
            LIMIT ${limit}
        `);
        return result.rows as RankingRow[];
    }

    async getTopPerformers(id: number): Promise<TopPerformerData[] | null> {
        const [row] = await this.db
            .select({ data: TopPerformers.data })
            .from(TopPerformers)
            .where(eq(TopPerformers.id, id))
            .limit(1)
        return row?.data ?? null;
    }

    async updateTopPerformers(id: number, data: TopPerformerData[]): Promise<TopPerformerRow | null> {
        const [row] = await this.db
            .update(TopPerformers)
            .set({ data: data })
            .where(eq(TopPerformers.id, id))
            .returning();

        return row ?? null;
    }

    async ensureSeedRow(): Promise<void> {
        await this.db
            .insert(TopPerformers)
            .values({ id: 1, data: [] })
            .onConflictDoNothing({ target: TopPerformers.id })
    }
}