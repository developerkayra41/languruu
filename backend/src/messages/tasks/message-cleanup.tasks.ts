import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MessagesService, MESSAGE_TTL_DAYS } from '../messages.service';

@Injectable()
export class MessageCleanupTasks {
  private readonly logger = new Logger(MessageCleanupTasks.name);

  constructor(private readonly messagesService: MessagesService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredMessages() {
    try {
      const removed = await this.messagesService.purgeExpired();
      if (removed > 0) {
        this.logger.log(`Mesaj temizliği: ${removed} mesaj silindi (${MESSAGE_TTL_DAYS} günden eski)`);
      }
    } catch (err) {
      this.logger.error('Mesaj temizlik görevi başarısız', err as Error);
    }
  }
}
