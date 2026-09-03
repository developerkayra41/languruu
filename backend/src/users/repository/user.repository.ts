import { RegisterRequestDTO } from './../../auth/dto/request/Register.request.dto';
import { Inject } from "@nestjs/common";
import { and, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { UserResponse } from 'src/_base/base.user.resonse';
import { users } from "src/_common/drizzle/users";
import { AuthUser } from 'src/_common/types/auth-user.type';

export class UserRepository {
    constructor(@Inject('DRIZZLE') private readonly db) { }

    findActiveByEmail = async (email: string): Promise<AuthUser | null> => {
        const [user] = await this.db.
            select({
                id: users.id,
                user_name: users.user_name,
                email: users.email,
                full_name: users.full_name,
                password: users.password,
                description: users.description,
                avatar_url: users.avatar_url,
                is_banned: users.is_banned
            })
            .from(users)
            .where(
                and(
                    eq(users.email, email),
                    isNull(users.deleted_at)
                )
            )
            .limit(1);
        return user ?? null;
    }

    create = async (data: RegisterRequestDTO): Promise<UserResponse> => {
        const [user] = await this.db
            .insert(users)
            .values(data)
            .returning({
                id: users.id,
                user_name: users.user_name,
                email: users.email,
                full_name: users.full_name,
                description: users.description,
                avatar_url: users.avatar_url
            })

        return user ?? null;

    }

    existByUserName = async (userName: string) => await this.db.select().from(users).where(and(eq(users.user_name, userName), isNull(users.deleted_at))).limit(1);

    existByEmail = async (email: string) => await this.db.select().from(users).where(and(eq(users.email, email), isNull(users.deleted_at))).limit(1);

    getUsersByIds = async (ids: number[]): Promise<{ id: number; full_name: string; user_name: string; avatar_url?: string }[]> => {
        const userList = await this.db
            .select({
                id: users.id, full_name: users.full_name, user_name: users.user_name, avatar_url: users.avatar_url,
            })
            .from(users)
            .where(inArray(users.id, ids))

        return userList;
    }

    findById = async (userId: number): Promise<AuthUser | null> => {
        const [user] = await this.db
            .select({
                id: users.id,
                user_name: users.user_name,
                email: users.email,
                full_name: users.full_name,
                password: users.password,
                description: users.description,
                avatar_url: users.avatar_url,
                updated_at: users.updated_at,
                email_verified: users.email_verified,
                discovery_source: users.discovery_source
            })
            .from(users)
            .where(and(eq(users.id, userId), isNull(users.deleted_at)))
            .limit(1);
        return user ?? null;
    };

    setDiscoverySource = async (userId: number, source: string): Promise<void> => {
        await this.db
            .update(users)
            .set({ discovery_source: source })
            .where(and(eq(users.id, userId), isNull(users.deleted_at)));
    };

    findByUsername = async (userName: string): Promise<{ id: number } | null> => {
        const [user] = await this.db
            .select({ id: users.id })
            .from(users)
            .where(and(eq(users.user_name, userName), isNull(users.deleted_at)))
            .limit(1);
        return user ?? null;
    };

    updateProfile = async (
        userId: number,
        data: { user_name?: string; avatar_url?: string | null }
    ): Promise<UserResponse | null> => {
        const [user] = await this.db
            .update(users)
            .set(data)
            .where(eq(users.id, userId))
            .returning({
                id: users.id,
                user_name: users.user_name,
                email: users.email,
                full_name: users.full_name,
                description: users.description,
                avatar_url: users.avatar_url,
            });
        return user ?? null;
    };

    updateEmail = async (userId: number, newEmail: string): Promise<UserResponse | null> => {
        const [user] = await this.db
            .update(users)
            .set({ email: newEmail, email_verified: false, verified_at: null })
            .where(eq(users.id, userId))
            .returning({
                id: users.id,
                user_name: users.user_name,
                email: users.email,
                full_name: users.full_name,
                description: users.description,
                avatar_url: users.avatar_url,
                email_verified: users.email_verified,
            });
        return user ?? null;
    };

    updatePassword = async (userId: number, hashedPassword: string): Promise<void> => {
        await this.db
            .update(users)
            .set({ password: hashedPassword })
            .where(eq(users.id, userId));
    };

    findByUsernamePublic = async (userName: string) => {
        const [user] = await this.db
            .select({
                id: users.id,
                user_name: users.user_name,
                full_name: users.full_name,
                avatar_url: users.avatar_url,
            })
            .from(users)
            .where(and(eq(users.user_name, userName), isNull(users.deleted_at)))
            .limit(1);
        return user ?? null;
    };


    findByGoogleId = async (googleId: string): Promise<AuthUser | null> => {
        const [user] = await this.db
            .select({
                id: users.id, user_name: users.user_name, email: users.email,
                full_name: users.full_name, password: users.password,
                description: users.description, avatar_url: users.avatar_url,
                is_banned: users.is_banned
            })
            .from(users)
            .where(and(eq(users.google_id, googleId), isNull(users.deleted_at)))
            .limit(1);
        return user ?? null;
    };

    linkGoogleId = async (userId: number, googleId: string): Promise<AuthUser | null> => {
        const [user] = await this.db
            .update(users)
            .set({ google_id: googleId, email_verified: true, verified_at: new Date() })
            .where(eq(users.id, userId))
            .returning({
                id: users.id, user_name: users.user_name, email: users.email,
                full_name: users.full_name, password: users.password,
                description: users.description, avatar_url: users.avatar_url,
                is_banned: users.is_banned
            });
        return user ?? null;
    };

    createFromGoogle = async (data: {
        email: string; full_name: string; user_name: string; google_id: string; avatar_url?: string;
    }): Promise<AuthUser | null> => {
        const [user] = await this.db
            .insert(users)
            .values({ ...data, password: null, email_verified: true, verified_at: new Date() })
            .returning({
                id: users.id, user_name: users.user_name, email: users.email,
                full_name: users.full_name, password: users.password,
                description: users.description, avatar_url: users.avatar_url,
            });
        return user ?? null;
    };

    countActiveUsers = async (): Promise<number> => {
        const [row] = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(users)
            .where(isNull(users.deleted_at));
        return row?.count ?? 0;
    };

    markEmailVerified = async (userId: number): Promise<void> => {
        await this.db
            .update(users)
            .set({ email_verified: true, verified_at: new Date() })
            .where(eq(users.id, userId));
    };

    softDelete = async (userId: number): Promise<void> => {
        const [u] = await this.db
            .select({ email: users.email, user_name: users.user_name })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
        if (!u) return;
        await this.db.update(users).set({
            deleted_at: new Date(),
            email: `deleted_${userId}_${u.email}`,
            user_name: `deleted_${userId}_${u.user_name}`,
            google_id: null,
        }).where(eq(users.id, userId));
    };

    // 7 gün temizliği için: doğrulanmamış + silinmemiş + verilen tarihten eski kullanıcılar
    findUnverifiedBefore = async (date: Date): Promise<{ id: number }[]> => {
        return await this.db
            .select({ id: users.id })
            .from(users)
            .where(and(
                eq(users.email_verified, false),
                isNull(users.deleted_at),
                lt(users.created_at, date),
            ));
    };

    updateLastSeen = async (userId: number): Promise<void> => {
        await this.db.update(users).set({ last_seen_at: new Date() }).where(eq(users.id, userId));
    };

    setBanned = async (userId: number, banned: boolean) => {
        await this.db.update(users).set({ is_banned: banned, banned_at: banned ? new Date() : null })
            .where(eq(users.id, userId))
    }

    // token_valid_after'ı şimdiye çeker → bu andan ÖNCE üretilmiş tüm access
    // token'lar guard tarafından geçersiz sayılır (tüm cihazlardan anında çıkış).
    bumpTokenValidAfter = async (userId: number): Promise<void> => {
        await this.db.update(users).set({ token_valid_after: new Date() }).where(eq(users.id, userId));
    }

    // Bir grup tamamlanınca çağrılır: günlük seriyi güncelle + tamamlanan tur +1.
    recordStudyCompletion = async (userId: number): Promise<void> => {
        const [row] = await this.db
            .select({ streak: users.study_streak, last: users.last_study_date })
            .from(users).where(eq(users.id, userId)).limit(1);
        if (!row) return;

        const todayStr = new Date().toISOString().slice(0, 10);
        const yesterdayStr = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

        let newStreak: number;
        if (row.last === todayStr) newStreak = row.streak;              // bugün zaten sayıldı
        else if (row.last === yesterdayStr) newStreak = row.streak + 1; // seri devam
        else newStreak = 1;                                            // yeni seri (kırılmıştı)

        await this.db.update(users).set({
            study_streak: newStreak,
            last_study_date: todayStr,
            completed_rounds: sql`${users.completed_rounds} + 1`,
        }).where(eq(users.id, userId));
    };

    getStudyStats = async (userId: number): Promise<{ study_streak: number; last_study_date: string | null; completed_rounds: number; game_score: number } | null> => {
        const [row] = await this.db
            .select({
                study_streak: users.study_streak,
                last_study_date: users.last_study_date,
                completed_rounds: users.completed_rounds,
                game_score: users.game_score,
            })
            .from(users).where(eq(users.id, userId)).limit(1);
        return row ?? null;
    };

    addGameScore = async (userId: number, points: number): Promise<void> => {
        if (!Number.isFinite(points) || points <= 0) return;
        await this.db
            .update(users)
            .set({ game_score: sql`${users.game_score} + ${Math.round(points)}` })
            .where(eq(users.id, userId));
    };
}