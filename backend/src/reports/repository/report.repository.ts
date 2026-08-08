import { Inject } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { reports } from "src/_common/drizzle/reports";
import { CreateReport } from "src/_common/types/report.type";

export class ReportRepository {
    constructor(@Inject('DRIZZLE') private readonly db) { }

    async create(data: CreateReport): Promise<void> {
        await this.db.insert(reports).values(data).execute();
    }

    async listForAdmin(status: string | undefined, limit = 50) {
        const result = await this.db.execute(sql`
            SELECT r.id, r.target_type, r.target_ref, r.reason, r.description,
            r.status, r.created_at, 
            u.user_name AS reporter_username FROM reports r
            LEFT JOIN users u ON u.id = r.reporter_user_id
            WHERE r.status = ${status ?? 'open'}
            ORDER BY r.created_at DESC LIMIT ${limit}
            `);
        return result.rows;
    }

    async resolve(id: number, status: string): Promise<void> {
        await this.db.update(reports).set({ status, reviewed_at: new Date() })
            .where(eq(reports.id, id)).execute();
    }

}