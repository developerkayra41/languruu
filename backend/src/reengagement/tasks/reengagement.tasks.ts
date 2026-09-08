import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReengagementService } from '../reengagement.service';

@Injectable()
export class ReengagementTasks {
  private readonly logger = new Logger(ReengagementTasks.name);

  constructor(private readonly reengagementService: ReengagementService) {}

  @Cron('0 10 * * *')
  async handleReengagement() {
    try {
      const result = await this.reengagementService.runBatch();
      this.logger.log(
        `Hatırlatma turu: ${result.sent}/${result.eligible} gönderildi (${result.failed} başarısız)`,
      );
    } catch (err) {
      this.logger.error('Hatırlatma görevi başarısız', err as Error);
    }
  }
}
