import { Inject, Injectable } from '@nestjs/common';
import { users } from '../drizzle/users';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthStateService {
    constructor(@Inject('DRIZZLE') private readonly db) { }

    async getAuthState(userId: number): Promise<{ is_banned: boolean; deleted_at: Date, token_valid_after: Date } | null> {
        const [row] = await this.db
            .select({
                is_banned: users.is_banned,
                deleted_at: users.deleted_at,
                token_valid_after: users.token_valid_after
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
        return row ?? null;
    }
}
