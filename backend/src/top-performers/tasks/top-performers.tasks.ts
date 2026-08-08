import { TopPerformersService } from './../top-performers.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Timeout } from '@nestjs/schedule';

@Injectable()
export class TopPerformersTasks {
    private readonly logger = new Logger(TopPerformersTasks.name);

    constructor(private readonly topPerformersService: TopPerformersService) { }

    @Cron(CronExpression.EVERY_10_MINUTES)
    async handleTopPerformersSync() {
        this.logger.log('Top performers güncelleme görevi başladı (10 dk)');
        try {
            await this.topPerformersService.updateTopPerformer();
            this.logger.log('Top performers görevi başarıyla tamamlandı');
        } catch (error) {
            this.logger.error('Top performers görevi başarısız oldu', error);
        }
    }
}

