import { Inject, Logger } from "@nestjs/common";
import { errorLogs } from "src/_common/drizzle/error-logs";
import { CreateErrorLog } from "src/_common/types/error-log.type";

export class ErrorLogRepository {
    private readonly logger = new Logger(ErrorLogRepository.name);
    constructor(@Inject('DRIZZLE') private readonly db) { }

    async log(data: CreateErrorLog): Promise<void> {
        try {
            await this.db.insert(errorLogs).values(data).execute();
        } catch (err) {
            // Hata loglamanın kendisi patlarsa asıl akışı bozmasın — sadece konsola düş.
            this.logger.error('error_logs yazılamadı', err as Error);
        }
    }
}