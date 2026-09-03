import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from "@nestjs/common";
import { BaseController } from "src/_base/base.controller";
import { JwtAuthGuard } from "src/_common/guards/JwtAuthGuard";
import { AdminGuard } from "src/_common/guards/AdminGuard";
import { AdminRepository } from "./admin.repository";
import { AdminService } from "./admin.service";
import { ReportRepository } from "src/reports/repository/report.repository";

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController extends BaseController {
    constructor(
        private readonly adminRepo: AdminRepository,
        private readonly adminService: AdminService,
        private readonly reportRepo: ReportRepository,
    ) { super('AdminController'); }

    @Get('stats')
    async stats(@Req() req: any) {
        const data = await this.adminRepo.getStats();
        return this.createSuccessResponse({ data, message: 'success', success: true }, req);
    }

    @Post('users/:id/ban')
    async ban(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        await this.adminService.banUser(id);
        return this.createSuccessResponse({ data: { success: true }, message: 'success', success: true }, req);
    }

    @Post('users/:id/unban')
    async unban(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        await this.adminService.unbanUser(id);
        return this.createSuccessResponse({ data: { success: true }, message: 'success', success: true }, req);
    }

    @Get('users')
    async users(
        @Query('filter') filter: string,
        @Query('search') search: string,
        @Query('page') page: string,
        @Req() req: any,
    ) {
        const data = await this.adminRepo.listUsers({
            filter, search, page: Math.max(1, Number(page) || 1), pageSize: 10,
        });
        return this.createSuccessResponse({ data, message: 'success', success: true }, req);
    }

    @Get('discovery-sources')
    async discoverySources(@Req() req: any) {
        const data = await this.adminRepo.getDiscoverySources();
        return this.createSuccessResponse({ data, message: 'success', success: true }, req);
    }

    @Get('errors')
    async errors(@Req() req: any) {
        const data = await this.adminRepo.getRecentErrors();
        return this.createSuccessResponse({ data, message: 'success', success: true }, req);
    }

    @Get('security-events')
    async securityEvents(@Req() req: any) {
        const data = await this.adminRepo.getRecentSecurityEvents();
        return this.createSuccessResponse({ data, message: 'success', success: true }, req);
    }

    @Get('reports')
    async reports(@Query('status') status: string, @Req() req: any) {
        const data = await this.reportRepo.listForAdmin(status);
        return this.createSuccessResponse({ data, message: 'success', success: true }, req);
    }

    @Post('reports/:id/resolve')
    async resolveReport(@Param('id', ParseIntPipe) id: number, @Body('status') status: string, @Req() req: any) {
        await this.reportRepo.resolve(id, status === 'dismissed' ? 'dismissed' : 'reviewed');
        return this.createSuccessResponse({ data: { success: true }, message: 'success', success: true }, req);
    }
}