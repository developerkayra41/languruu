import { Inject } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { userSessions } from "src/_common/drizzle/user-sessions";
import { CreateUserSession, UserSessionResult } from "src/_common/types/user-session.type";

export class UserSessionRepository {
    constructor(@Inject('DRIZZLE') private readonly db) { }

    async create(data: CreateUserSession) {
        await this.db.insert(userSessions).values(data).execute();
    }

    async findByRefreshTokenHash(hashedRefreshToken: string): Promise<UserSessionResult | null> {
        const session = await this.db
            .select()
            .from(userSessions)
            .where(eq(userSessions.refresh_token_hash, hashedRefreshToken))
            .limit(1);
        return session[0] ?? null;
    }

    async revokeFamily(familyId: string): Promise<void> {
        await this.db
            .update(userSessions)
            .set({ is_revoked: true, revoked_at: new Date() })
            .where(eq(userSessions.family_id, familyId))
            .execute();
    }

    async revoke(id: number): Promise<boolean> {
        const result = await this.db
            .update(userSessions)
            .set({ is_revoked: true, revoked_at: new Date() })
            .where(eq(userSessions.id, id))
            .execute();
        return result.rowCount > 0;
    }

    async transactionRevokeAndCreate(id: number, data: CreateUserSession): Promise<void> {
        await this.db.transaction(async (tx) => {
            await tx.update(userSessions)
                .set({ is_revoked: true, revoked_at: new Date() })
                .where(eq(userSessions.id, id))
                .execute();

            await tx.insert(userSessions).values(data).execute();
        });
    }

    async revokeAllForUser(userId: number): Promise<void> {
        await this.db
            .update(userSessions)
            .set({ is_revoked: true, revoked_at: new Date() })
            .where(and(eq(userSessions.user_id, userId), eq(userSessions.is_revoked, false)))
            .execute();
    }

}
