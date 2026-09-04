import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { TopPerformerData, TopPerformerRow } from 'src/_common/types/top-performers.type';
import { UserRepository } from 'src/users/repository/user.repository';
import { WordRepository } from 'src/words/repository/words.repository';
import { TopPerformerRepository } from './repository/top-performers.repository';
import { TopPerformers } from 'src/_common/drizzle/top-performers';
import { levelFromXp } from 'src/_common/utils/xp-level';

@Injectable()
export class TopPerformersService implements OnModuleInit {
    private readonly logger = new Logger(TopPerformersService.name);
    constructor(@Inject(UserRepository) private readonly userRepo: UserRepository,
        private readonly wordsRepo: WordRepository,
        private readonly topPerformerRepo: TopPerformerRepository) { }

    onModuleInit = async () => {
        try {
            await this.topPerformerRepo.ensureSeedRow();
            this.logger.log('Top performers seed satırı kontrol edildi/oluşturuldu.')
        } catch (error) {
            this.logger.error('Seed satırı oluşturulurken hata oluştu', error);
        }
    }

    getTopPerformers = async (): Promise<TopPerformerData[]> => {
        const list = await this.topPerformerRepo.getTopPerformers(1);
        if (!list) return [];
        return list;
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
