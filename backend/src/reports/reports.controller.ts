import { Body, Controller, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { BaseController } from 'src/_base/base.controller';
import { JwtAuthGuard } from 'src/_common/guards/JwtAuthGuard';
import { ReportRepository } from './repository/report.repository';
import { Throttle } from '@nestjs/throttler';
import { CreateReportRequestDTO } from './dto/CreateReport.dto';
import { ReportReason, ReportTargetType } from 'src/_common/types/report.type';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController extends BaseController {
    constructor(private readonly reportRepo: ReportRepository) { super('ReportsController') }

    @Post()
    @Throttle({ default: { ttl: 60_000, limit: 10 } })
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async create(@Body() body: CreateReportRequestDTO, @Req() req: any) {
        await this.reportRepo.create({
            reporter_user_id: req.user.id,
            target_type: body.target_type as ReportTargetType,
            target_ref: body.target_ref,
            reason: body.reason as ReportReason,
            description: body.description
        });
        return this.createSuccessResponse({ data: { success: true }, message: 'success', success: true }, req);
    }
}
