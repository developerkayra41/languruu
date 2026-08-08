import { Inject } from "@nestjs/common";
import { and, eq, gt, isNull } from "drizzle-orm";
import { authTokens } from "src/_common/drizzle/auth-tokens";

export class AuthTokenRepository {
    constructor(@Inject('DRIZZLE') private readonly db) { }

    async create(data: { user_id: number; token_hash: string; purpose: string; expires_at: Date }): Promise<void> {
        await this.db.insert(authTokens).values(data).execute();
    }

    /** Kullanılmamış + süresi geçmemiş token'ı hash + amaç ile bulur. */
    async findValid(tokenHash: string, purpose: string) {
        const [row] = await this.db
            .select()
            .from(authTokens)
            .where(and(
                eq(authTokens.token_hash, tokenHash),
                eq(authTokens.purpose, purpose),
                isNull(authTokens.used_at),
                gt(authTokens.expires_at, new Date()),
            ))
            .limit(1);
        return row ?? null;
    }

    async markUsed(id: number): Promise<void> {
        await this.db.update(authTokens).set({ used_at: new Date() }).where(eq(authTokens.id, id)).execute();
    }
}