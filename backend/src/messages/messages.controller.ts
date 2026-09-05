import { Body, Controller, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BaseController } from 'src/_base/base.controller';
import { JwtAuthGuard } from 'src/_common/guards/JwtAuthGuard';
import { MessagesService } from './messages.service';
import { SendMessageRequestDTO } from './dto/request/SendMessage.request.dto';
import { ThreadUserNameRequestDTO } from './dto/request/ThreadUserName.request.dto';
import { MessageIdRequestDTO } from './dto/request/MessageId.request.dto';
import { EditMessageRequestDTO } from './dto/request/EditMessage.request.dto';

@ApiTags('messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController extends BaseController {
    constructor(private readonly messagesService: MessagesService) {
        super('MessagesController');
    }

    @Post('conversations')
    @ApiOperation({ summary: 'messages/conversations API', description: 'Arkadaşlarla olan konuşmaları son mesajlarıyla listeler' })
    async conversations(@Req() req) {
        const result = await this.messagesService.listConversations(req.user.id);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @Post('unread')
    @ApiOperation({ summary: 'messages/unread API', description: 'Okunmamış mesaj gönderen kişi sayısını getirir' })
    async unread(@Req() req) {
        const result = await this.messagesService.unreadSummary(req.user.id);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @Post('thread')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiBody({ type: ThreadUserNameRequestDTO })
    @ApiOperation({ summary: 'messages/thread API', description: 'Bir arkadaşla olan yazışmayı getirir ve okundu olarak işaretler' })
    async thread(@Req() req, @Body() body: ThreadUserNameRequestDTO) {
        const result = await this.messagesService.getThread(req.user.id, body.user_name);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @Post('send')
    @Throttle({ default: { ttl: 60_000, limit: 40 } })
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiBody({ type: SendMessageRequestDTO })
    @ApiOperation({ summary: 'messages/send API', description: 'Bir arkadaşa mesaj gönderir' })
    async send(@Req() req, @Body() body: SendMessageRequestDTO) {
        const result = await this.messagesService.send(req.user.id, body.user_name, body.body);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @Post('edit')
    @Throttle({ default: { ttl: 60_000, limit: 40 } })
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiBody({ type: EditMessageRequestDTO })
    @ApiOperation({ summary: 'messages/edit API', description: 'Kendi mesajını düzenler, düzenlendi damgası basar' })
    async edit(@Req() req, @Body() body: EditMessageRequestDTO) {
        const result = await this.messagesService.editMessage(req.user.id, body.id, body.body);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @Post('delete')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiBody({ type: MessageIdRequestDTO })
    @ApiOperation({ summary: 'messages/delete API', description: 'Kendi mesajını her iki taraftan da siler' })
    async remove(@Req() req, @Body() body: MessageIdRequestDTO) {
        const result = await this.messagesService.deleteMessage(req.user.id, body.id);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }
}
