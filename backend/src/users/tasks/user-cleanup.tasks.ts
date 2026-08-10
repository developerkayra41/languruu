import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from '../users.service';

@Injectable()
export class UserCleanupTasks {
  private readonly logger = new Logger(UserCleanupTasks.name);

  constructor(private readonly usersService: UsersService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleUnverifiedCleanup() {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    try {
      const stale = await this.usersService.findUnverifiedBefore(cutoff);
      for (const u of stale) {
        await this.usersService.softDeleteUser(u.id);
      }
      this.logger.log(
        `Doğrulanmamış temizlik: ${stale.length} hesap silindi`,
      );
    } catch (err) {
      this.logger.error('Doğrulanmamış temizlik görevi başarısız', err as Error);
    }
  }
}
