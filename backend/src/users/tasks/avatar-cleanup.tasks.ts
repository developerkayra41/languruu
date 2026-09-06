import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from '../users.service';

@Injectable()
export class AvatarCleanupTasks {
  private readonly logger = new Logger(AvatarCleanupTasks.name);

  constructor(private readonly usersService: UsersService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleOrphanAvatars() {
    try {
      const { scanned, removed, cleared } = await this.usersService.purgeOrphanAvatars();
      if (removed > 0) {
        this.logger.log(
          `Avatar temizliği: ${scanned} dosya tarandı, ${removed} sahipsiz dosya silindi, ${cleared} kaydın avatar_url'i temizlendi`,
        );
      }
    } catch (err) {
      this.logger.error('Avatar temizlik görevi başarısız', err as Error);
    }
  }
}
