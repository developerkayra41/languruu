import { BadRequestException, ForbiddenException, Inject } from "@nestjs/common";
import { randomUUID } from "crypto";
import { eq } from 'drizzle-orm';
import { Words } from "src/_common/drizzle/words";
import { WordColumn, WordRow } from "src/_common/types/words.type";
import { WordRequestDTO } from "../dto/request/Word.request.dto";
import { sql } from "drizzle-orm";
import { ConfigService } from "@nestjs/config";
import { containsProfanity } from "src/_common/moderation/profanity";



export class WordRepository {
    constructor(@Inject('DRIZZLE') private readonly db,
        private readonly config: ConfigService) { }

    async getWordsByUserId(userId: number): Promise<WordRow | null> {
        const [words] = await this.db.select({ id: Words.id, user_id: Words.user_id, words: Words.words })
            .from(Words)
            .where(eq(Words.user_id, userId))
        return words ?? null;
    }

    async getWords(): Promise<WordRow[] | null> {
        const words = await this.db.select({ id: Words.id, user_id: Words.user_id, words: Words.words })
            .from(Words)
        return words.length > 0 ? words : null;
    }

    async getWordsById(userId: number, wordId: number): Promise<WordColumn | null> {
        const words: WordRow | null = await this.getWordsByUserId(userId);
        if (!words) return null;
        const word = words.words.find(w => w.id === wordId)
        return word ?? null;
    }

    private async upsert(userId: number, wordColumn: WordColumn[]): Promise<WordColumn> {
        const [row] = await this.db
            .insert(Words)
            .values({ user_id: userId, words: wordColumn })
            .onConflictDoUpdate({
                target: Words.user_id,
                set: { words: wordColumn, updated_at: new Date() },
            })
            .returning({ words: Words.words });

        return row.words[0];
    }

    async upsertWord(userId: number, word: WordRequestDTO): Promise<WordColumn | null> {

        if (containsProfanity(word.name)) throw new BadRequestException("Grup adı uygunsuz içerik barındırıyor.");

        const willShare = word.isShared && !word.sourceShareId && word.wordPool.length > 0;
        if (willShare) {
            const flat = word.wordPool.flatMap((p) => [...(p.term ?? []), ...(p.translation ?? [])]);
            if (flat.some(containsProfanity)) {
                throw new BadRequestException("Paylaşmak istediğin grupta uygunsuz içerik var. Paylaşmadan önce düzelt.");
            }
        }

        const words = await this.getWordsByUserId(userId);

        const resolveShareId = (existing?: string, isCopiedGroup?: boolean, wordPoolLength?: number): string | undefined => {
            if (isCopiedGroup) return undefined;
            if (!word.isShared) return existing;
            if (wordPoolLength === 0) return existing;
            return existing ?? randomUUID();
        };

        if (!words) {
            const isCopiedGroup = !!word.sourceShareId;
            const isEmpty = word.wordPool.length === 0;
            const newColumn: WordColumn = {
                ...word,
                id: 1,
                isShared: (isCopiedGroup || isEmpty) ? false : word.isShared,
                shareId: resolveShareId(word.shareId, isCopiedGroup, word.wordPool.length),
            };
            return this.upsert(userId, [newColumn]);
        }

        const columns = words.words;
        const index = word.id !== undefined
            ? columns.findIndex(c => c.id === word.id)
            : -1;

        let result: WordColumn;

        if (index !== -1) {
            const existingColumn = columns[index];
            const isCopiedGroup = !!existingColumn.sourceShareId;

            if (word.isShared && isCopiedGroup)
                throw new ForbiddenException('Bu kelime grubu size ait değil, paylaşılamaz.');

            const isEmpty = word.wordPool.length === 0;
            const shareId = resolveShareId(existingColumn.shareId, isCopiedGroup, word.wordPool.length);

            columns[index] = {
                ...existingColumn,
                name: word.name,
                description: word.description,
                wordPool: word.wordPool,
                languages: word.languages,
                isShared: (isCopiedGroup || isEmpty) ? false : word.isShared,
                shareId,
            };
            result = columns[index];
        } else {
            const maxGroups = this.config.get<number>('app.MAX_GROUPS') ?? 15;
            if (columns.length >= maxGroups) {
                throw new ForbiddenException(`En fazla ${maxGroups} kelime grubu oluşturabilirsiniz.`);
            }
            const newId = columns.length > 0 ? Math.max(...columns.map(c => c.id)) + 1 : 1;
            const isCopiedGroup = !!word.sourceShareId;
            const isEmpty = word.wordPool.length === 0;
            const newColumn: WordColumn = {
                ...word,
                id: newId,
                isShared: (isCopiedGroup || isEmpty) ? false : word.isShared,
                shareId: resolveShareId(word.shareId, isCopiedGroup, word.wordPool.length),
            };
            columns.push(newColumn);
            result = newColumn;
        }

        await this.db.update(Words).set({ words: columns }).where(eq(Words.user_id, userId));
        return result;
    }

    async getTopWordCounts(limit: number): Promise<{ user_id: number; total_word: number }[]> {
        const result = await this.db.execute(sql`
            SELECT w.user_id AS user_id,
                   COALESCE(SUM(jsonb_array_length(COALESCE(col->'wordPool', '[]'::jsonb))), 0)::int AS total_word
            FROM words w
            CROSS JOIN LATERAL jsonb_array_elements(w.words) AS col
            WHERE w.words IS NOT NULL AND jsonb_typeof(w.words) = 'array'
            GROUP BY w.user_id
            ORDER BY total_word DESC
            LIMIT ${limit}
        `);
        return result.rows as { user_id: number; total_word: number }[];
    }

    async deleteWord(userId: number, wordId: number): Promise<WordColumn | null> {
        const words = await this.getWordsByUserId(userId);
        if (!words) return null;

        const index = words.words.findIndex(c => c.id === wordId);
        if (index === -1) return null;

        const [deleted] = words.words.splice(index, 1);

        await this.db.update(Words).set({ words: words.words }).where(eq(Words.user_id, userId))
        return deleted;
    }
}