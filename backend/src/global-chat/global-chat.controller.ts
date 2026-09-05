import { Body, Controller, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BaseController } from 'src/_base/base.controller';
import { JwtAuthGuard } from 'src/_common/guards/JwtAuthGuard';
import { GlobalChatService } from './global-chat.service';
import { SendGlobalMessageRequestDTO } from './dto/request/SendGlobalMessage.request.dto';
import { EditGlobalMessageRequestDTO } from './dto/request/EditGlobalMessage.request.dto';
import { GlobalMessageIdRequestDTO } from './dto/request/GlobalMessageId.request.dto';

@ApiTags('global-chat')
@ApiBearerAuth()
@Controller('global-chat')
@UseGuards(JwtAuthGuard)
export class GlobalChatController extends BaseController {
    constructor(private readonly globalChatService: GlobalChatService) {
        super('GlobalChatController');
    }

    @Post('list')
    @ApiOperation({ summary: 'global-chat/list API', description: 'Genel sohbetin son mesajlarını getirir' })
    async list(@Req() req) {
        const result = await this.globalChatService.list(req.user.id);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @Post('send')
    @Throttle({ default: { ttl: 60_000, limit: 20 } })
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiBody({ type: SendGlobalMessageRequestDTO })
    @ApiOperation({ summary: 'global-chat/send API', description: 'Genel sohbete mesaj gönderir' })
    async send(@Req() req, @Body() body: SendGlobalMessageRequestDTO) {
        const result = await this.globalChatService.send(req.user.id, body.body);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @Post('edit')
    @Throttle({ default: { ttl: 60_000, limit: 20 } })
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiBody({ type: EditGlobalMessageRequestDTO })
    @ApiOperation({ summary: 'global-chat/edit API', description: 'Genel sohbetteki kendi mesajını düzenler' })
    async edit(@Req() req, @Body() body: EditGlobalMessageRequestDTO) {
        const result = await this.globalChatService.editMessage(req.user.id, body.id, body.body);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @Post('delete')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiBody({ type: GlobalMessageIdRequestDTO })
    @ApiOperation({ summary: 'global-chat/delete API', description: 'Genel sohbetteki kendi mesajını siler' })
    async remove(@Req() req, @Body() body: GlobalMessageIdRequestDTO) {
        const result = await this.globalChatService.deleteMessage(req.user.id, body.id);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }
}
