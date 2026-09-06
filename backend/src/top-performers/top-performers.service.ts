import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { TopPerformerData, TopPerformerRow } from 'src/_common/types/top-performers.type';
import { UserRepository } from 'src/users/repository/user.repository';
import { WordRepository } from 'src/words/repository/words.repository';
import { TopPerformerRepository } from './repository/top-performers.repository';
import { TopPerformers } from 'src/_common/drizzle/top-performers';
import { levelFromXp } from 'src/_common/utils/xp-level';
import { PresenceService } from 'src/_common/presence/presence.service';

@Injectable()
export class TopPerformersService implements OnModuleInit {
    private readonly logger = new Logger(TopPerformersService.name);
    constructor(@Inject(UserRepository) private readonly userRepo: UserRepository,
        private readonly wordsRepo: WordRepository,
        private readonly topPerformerRepo: TopPerformerRepository,
        private readonly presence: PresenceService) { }

    onModuleInit = async () => {
        try {
            await this.topPerformerRepo.ensureSeedRow();
            this.logger.log('Top performers seed satırı kontrol edildi/oluşturuldu.')
        } catch (error) {
            this.logger.error('Seed satırı oluşturulurken hata oluştu', error);
        }
    }

    getTopPerformers = async (viewerId: number): Promise<TopPerformerData[]> => {
        const list = await this.topPerformerRepo.getTopPerformers(1);
        if (!list) return [];

        const scored = list.filter((row) => (row.xp ?? 0) > 0);
        const onlineIds = await this.presence.visibleIds(viewerId, scored.map((row) => row.user_id));
        return scored.map((row) => ({ ...row, is_online: onlineIds.has(row.user_id) }));
    }

    updateTopPerformer = async (): Promise<TopPerformerRow> => {
        const ranking = await this.topPerformerRepo.computeRanking(10);

        const data: TopPerformerData[] = ranking.map((r) => ({
            user_id: r.user_id,
            full_name: r.full_name ?? 'Bilinmiyor',
            user_name: r.user_name ?? 'Bilinmiyor',
            avatar_url: r.avatar_url ?? undefined,
            total_word: r.total_word,
            streak: r.effective_streak,
            xp: r.xp ?? 0,
            level: levelFromXp(r.xp ?? 0),
        }));

        const savedRow = await this.topPerformerRepo.updateTopPerformers(1, data);
        if (!savedRow) throw new InternalServerErrorException();
        return savedRow;
    };




}
