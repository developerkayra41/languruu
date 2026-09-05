import { Body, Controller, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BaseController } from 'src/_base/base.controller';
import { JwtAuthGuard } from 'src/_common/guards/JwtAuthGuard';
import { FriendsService } from './friends.service';
import { FriendUserNameRequestDTO } from './dto/request/FriendUserName.request.dto';
import { RespondFriendRequestDTO } from './dto/request/RespondFriendRequest.request.dto';

@ApiTags('friends')
@ApiBearerAuth()
@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController extends BaseController {
    constructor(private readonly friendsService: FriendsService) {
        super('FriendsController');
    }

    @Post('status')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiBody({ type: FriendUserNameRequestDTO })
    @ApiOperation({ summary: 'friends/status API', description: 'İki kullanıcı arasındaki arkadaşlık durumunu getirir' })
    async status(@Req() req, @Body() body: FriendUserNameRequestDTO) {
        const result = await this.friendsService.getStatus(req.user.id, body.user_name);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @Post('request')
    @Throttle({ default: { ttl: 60_000, limit: 20 } })
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiBody({ type: FriendUserNameRequestDTO })
    @ApiOperation({ summary: 'friends/request API', description: 'Bir kullanıcıya arkadaşlık isteği gönderir' })
    async request(@Req() req, @Body() body: FriendUserNameRequestDTO) {
        const result = await this.friendsService.sendRequest(req.user.id, body.user_name);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @Post('respond')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiBody({ type: RespondFriendRequestDTO })
    @ApiOperation({ summary: 'friends/respond API', description: 'Gelen arkadaşlık isteğini kabul eder veya reddeder' })
    async respond(@Req() req, @Body() body: RespondFriendRequestDTO) {
        const result = await this.friendsService.respond(req.user.id, body.request_id, body.action);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @Post('cancel')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiBody({ type: FriendUserNameRequestDTO })
    @ApiOperation({ summary: 'friends/cancel API', description: 'Gönderilmiş arkadaşlık isteğini geri çeker' })
    async cancel(@Req() req, @Body() body: FriendUserNameRequestDTO) {
        const result = await this.friendsService.cancelRequest(req.user.id, body.user_name);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @Post('remove')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiBody({ type: FriendUserNameRequestDTO })
    @ApiOperation({ summary: 'friends/remove API', description: 'Arkadaşlığı sonlandırır' })
    async remove(@Req() req, @Body() body: FriendUserNameRequestDTO) {
        const result = await this.friendsService.removeFriend(req.user.id, body.user_name);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @Post('list')
    @ApiOperation({ summary: 'friends/list API', description: 'Arkadaş listesini getirir' })
    async list(@Req() req) {
        const result = await this.friendsService.listFriends(req.user.id);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @Post('requests')
    @ApiOperation({ summary: 'friends/requests API', description: 'Gelen bekleyen arkadaşlık isteklerini getirir' })
    async requests(@Req() req) {
        const result = await this.friendsService.listRequests(req.user.id);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @Post('summary')
    @ApiOperation({ summary: 'friends/summary API', description: 'Arkadaş ve bekleyen istek sayılarını getirir' })
    async summary(@Req() req) {
        const result = await this.friendsService.summary(req.user.id);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }
}
