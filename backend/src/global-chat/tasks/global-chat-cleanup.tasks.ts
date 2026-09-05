import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GlobalChatService, GLOBAL_MESSAGE_TTL_DAYS } from '../global-chat.service';

@Injectable()
export class GlobalChatCleanupTasks {
  private readonly logger = new Logger(GlobalChatCleanupTasks.name);

  constructor(private readonly globalChatService: GlobalChatService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredMessages() {
    try {
      const removed = await this.globalChatService.purgeExpired();
      if (removed > 0) {
        this.logger.log(`Genel sohbet temizliği: ${removed} mesaj silindi (${GLOBAL_MESSAGE_TTL_DAYS} günden eski)`);
      }
    } catch (err) {
      this.logger.error('Genel sohbet temizlik görevi başarısız', err as Error);
    }
  }
}
