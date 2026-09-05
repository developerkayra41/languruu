import { Body, Controller, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseController } from 'src/_base/base.controller';
import { JwtAuthGuard } from 'src/_common/guards/JwtAuthGuard';
import { NotificationsService } from './notifications.service';
import { ListNotificationsRequestDTO } from './dto/request/ListNotifications.request.dto';
import { NotificationIdRequestDTO } from './dto/request/NotificationId.request.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController extends BaseController {
    constructor(private readonly notificationsService: NotificationsService) {
        super('NotificationsController');
    }

    @Post('list')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiBody({ type: ListNotificationsRequestDTO })
    @ApiOperation({ summary: 'notifications/list API', description: 'Kullanıcının bildirimlerini ve okunmamış sayısını getirir' })
    async list(@Req() req, @Body() body: ListNotificationsRequestDTO) {
        const result = await this.notificationsService.list(req.user.id, body.limit, body.offset);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @Post('unread-count')
    @ApiOperation({ summary: 'notifications/unread-count API', description: 'Okunmamış bildirim sayısını getirir' })
    async unreadCount(@Req() req) {
        const result = await this.notificationsService.unreadCount(req.user.id);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @Post('read')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiBody({ type: NotificationIdRequestDTO })
    @ApiOperation({ summary: 'notifications/read API', description: 'Tek bir bildirimi okundu işaretler' })
    async markRead(@Req() req, @Body() body: NotificationIdRequestDTO) {
        const result = await this.notificationsService.markRead(req.user.id, body.id);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @Post('read-all')
    @ApiOperation({ summary: 'notifications/read-all API', description: 'Tüm bildirimleri okundu işaretler' })
    async markAllRead(@Req() req) {
        const result = await this.notificationsService.markAllRead(req.user.id);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }
}
