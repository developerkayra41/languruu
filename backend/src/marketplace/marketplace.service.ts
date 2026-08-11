import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

import { WordRepository } from 'src/words/repository/words.repository';
import { WordColumn } from 'src/_common/types/words.type';
import { MarketPlaceRepository } from './repository/marketplace.repository';
import { UserRepository } from 'src/users/repository/user.repository';
import { OnEvent } from '@nestjs/event-emitter';
import { WordsService } from 'src/words/words.service';

@Injectable()
export class MarketplaceService {
    constructor(
        private readonly marketplaceRepo: MarketPlaceRepository,
        private readonly userRepo: UserRepository,
        private readonly wordsRepo: WordRepository,
        private readonly wordsService: WordsService,
    ) { }

    @OnEvent('word-column.upserted')
    async handleWordColumnUpserted(payload: { userId: number; column: WordColumn }) {
        const { userId, column } = payload;
        if (column.isShared && column.shareId) {
            const [user] = await this.userRepo.getUsersByIds([userId]);
            await this.marketplaceRepo.upsertMarketplaceEntry({
                share_id: column.shareId,
                owner_user_id: userId,
                author_name: user?.full_name ?? 'Bilinmiyor',
                author_username: user?.user_name ?? 'bilinmiyor',
                name: column.name,
                description: column.description,
                word_count: column.wordPool.length,
                languages: column.languages,
            });
        } else if (!column.isShared && column.shareId) {
            await this.marketplaceRepo.removeMarketplaceEntry(column.shareId);
        }
    }

    @OnEvent('word-column.deleted')
    async handleWordColumnDeleted(payload: { userId: number; column: WordColumn }) {
        const { column } = payload;
        if (column.shareId) {
            await this.marketplaceRepo.removeMarketplaceEntry(column.shareId);
        }
    }

    search = async (
        params: { search?: string; languages?: string[]; sourceLanguage?: string; targetLanguage?: string; page: number; pageSize: number; onlyMine?: boolean },
        requestingUserId: number
    ) => {
        const { items, total } = await this.marketplaceRepo.searchMarketplace({
            ...params,
            ownerUserId: params.onlyMine ? requestingUserId : undefined,
        });

        const withOwnership = items.map((item) => ({
            ...item,
            is_own: item.owner_user_id === requestingUserId,
        }));

        return { items: withOwnership, total };
    };

    unshareOwnEntry = async (userId: number, shareId: string) => {
        const entry = await this.marketplaceRepo.findByShareId(shareId);
        if (!entry) throw new NotFoundException();

        if (entry.owner_user_id !== userId) {
            throw new ForbiddenException('Bu grubu kaldırma yetkiniz yok.');
        }

        const myWords = await this.wordsRepo.getWordsByUserId(userId);
        const column = myWords?.words.find((c) => c.shareId === shareId);
        if (!column) throw new NotFoundException();

        const updated = await this.wordsService.upsertWord(userId, {
            id: column.id,
            name: column.name,
            description: column.description,
            wordPool: column.wordPool,
            languages: column.languages,
            createdAt: column.createdAt,
            isShared: false,
            sourceShareId: column.sourceShareId,
            sourceAuthorUsername: column.sourceAuthorUsername,
        } as any);

        return updated;
    };

    getPoolDetail = async (shareId: string) => {
        const entry = await this.marketplaceRepo.findByShareId(shareId);
        if (!entry) throw new NotFoundException();

        const ownerWords = await this.wordsRepo.getWordsByUserId(entry.owner_user_id);
        const sourceColumn = ownerWords?.words.find((c) => c.shareId === shareId);
        if (!sourceColumn) throw new NotFoundException();

        return {
            name: entry.name,
            description: entry.description,
            languages: entry.languages,
            author_name: entry.author_name,
            author_username: entry.author_username,
            wordPool: sourceColumn.wordPool,
        };
    };

    copyToUser = async (userId: number, shareId: string): Promise<WordColumn> => {
        const entry = await this.marketplaceRepo.findByShareId(shareId);
        if (!entry) throw new NotFoundException();

        if (entry.owner_user_id === userId) {
            throw new BadRequestException('Kendi paylaştığınız bir grubu kendinize kopyalayamazsınız.');
        }

        const ownerWords = await this.wordsRepo.getWordsByUserId(entry.owner_user_id);
        const sourceColumn = ownerWords?.words.find((c) => c.shareId === shareId);
        if (!sourceColumn) throw new NotFoundException();

        const myWords = await this.wordsRepo.getWordsByUserId(userId);
        const existingCopy = myWords?.words.find((c) => c.sourceShareId === shareId);

        const newColumnInput = {
            id: existingCopy?.id,
            name: sourceColumn.name,
            description: sourceColumn.description,
            wordPool: sourceColumn.wordPool,
            languages: sourceColumn.languages,
            createdAt: existingCopy ? existingCopy.createdAt : new Date(),
            isShared: false,
            sourceShareId: shareId,
            sourceAuthorUsername: entry.author_username,
        };

        const copied = await this.wordsRepo.upsertWord(userId, newColumnInput as any);
        if (!copied) throw new NotFoundException();

        if (!existingCopy) {
            await this.marketplaceRepo.incrementDownloads(shareId);
        }

        return copied;
    };
}