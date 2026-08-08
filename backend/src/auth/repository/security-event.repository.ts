import { Inject, Logger } from "@nestjs/common";
import { securityEvents } from "src/_common/drizzle/security-events";
import { CreateSecurityEvent } from "src/_common/types/security-event.type";

export class SecurityEventRepository {
    private readonly logger = new Logger(SecurityEventRepository.name);
    constructor(@Inject('DRIZZLE') private readonly db) { }

    async log(data: CreateSecurityEvent): Promise<void> {
        try {
            await this.db.insert(securityEvents).values(data).execute();
        } catch (err) {
            this.logger.error('security event yazılamadı', err as Error);
        }
    }
}