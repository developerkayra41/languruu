import { Inject } from "@nestjs/common";
import { and, arrayOverlaps, desc, eq, ilike, or, SQL, sql } from "drizzle-orm";
import { Marketplace } from "src/_common/drizzle/marketplace";
import { MarketplaceEntry } from "src/_common/types/marketplace.type";


export class MarketPlaceRepository {
    constructor(@Inject('DRIZZLE') private readonly db) { }

    async searchMarketplace(params: {
        search?: string;
        languages?: string[];
        sourceLanguage?: string;
        targetLanguage?: string;
        page: number;
        pageSize: number;
        ownerUserId?: number;   // sadece "benim gruplarım" filtresi için
    }): Promise<{ items: MarketplaceEntry[]; total: number }> {
        const conditions: SQL[] = [];

        if (params.search) {
            const searchCondition = or(
                ilike(Marketplace.name, `%${params.search}%`),
                ilike(Marketplace.author_name, `%${params.search}%`),
                ilike(Marketplace.author_username, `%${params.search}%`)
            );
            if (searchCondition) conditions.push(searchCondition);
        }

        if (params.sourceLanguage) {
            conditions.push(eq(Marketplace.source_language, params.sourceLanguage));
        }
        if (params.targetLanguage) {
            conditions.push(eq(Marketplace.target_language, params.targetLanguage));
        }

        if (params.ownerUserId !== undefined) {
            conditions.push(eq(Marketplace.owner_user_id, params.ownerUserId));
        }

        conditions.push(sql`${Marketplace.owner_user_id} NOT IN (SELECT id FROM users WHERE is_banned = true)`);

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const items = await this.db
            .select()
            .from(Marketplace)
            .where(whereClause)
            .orderBy(desc(Marketplace.downloads))
            .limit(params.pageSize)
            .offset((params.page - 1) * params.pageSize);

        const [{ count }] = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(Marketplace)
            .where(whereClause);

        return { items, total: Number(count) };
    }

    async upsertMarketplaceEntry(entry: {
        share_id: string;
        owner_user_id: number;
        author_name: string;
        author_username: string;
        name: string;
        description?: string;
        word_count: number;
        languages: string[];
    }): Promise<void> {
        const source_language = entry.languages?.[0] ?? null;
        const target_language = entry.languages?.[1] ?? null;
        await this.db
            .insert(Marketplace)
            .values({ ...entry, source_language, target_language })
            .onConflictDoUpdate({
                target: Marketplace.share_id,
                set: {
                    name: entry.name,
                    description: entry.description,
                    word_count: entry.word_count,
                    languages: entry.languages,
                    author_name: entry.author_name,
                    author_username: entry.author_username,
                    // downloads bilerek set'e KONMADI — mevcut sayaç korunuyor
                },
            });
    }

    async removeMarketplaceEntry(shareId: string): Promise<void> {
        await this.db.delete(Marketplace).where(eq(Marketplace.share_id, shareId));
    }

    async findByShareId(shareId: string): Promise<MarketplaceEntry | null> {
        const [row] = await this.db
            .select()
            .from(Marketplace)
            .where(eq(Marketplace.share_id, shareId))
            .limit(1);
        return row ?? null;
    }

    async incrementDownloads(shareId: string): Promise<void> {
        // Atomik artırma: "önce oku, sonra +1 yaz" YAPMIYORUZ, tek sorguda
        // veritabanının kendisine "şu anki değerine 1 ekle" diyoruz — böylece
        // iki kullanıcı aynı anda kopyalarsa sayaç kaybolmaz (lost update olmaz).
        await this.db
            .update(Marketplace)
            .set({ downloads: sql`${Marketplace.downloads} + 1` })
            .where(eq(Marketplace.share_id, shareId));
    }
}