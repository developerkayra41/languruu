import { Body, Controller, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseController } from 'src/_base/base.controller';
import { BaseResponse } from 'src/_base/base.response';
import { JwtAuthGuard } from 'src/_common/guards/JwtAuthGuard';
import { GameTicketService } from './game-ticket.service';
import { GameService } from './game.service';
import { GameRoomsRequestDTO } from './dto/request/GameRooms.request.dto';
import { GameRoomSummaryDTO, GameTicketDTO } from './dto/response/Game.response.dto';
import { RoomSummary } from './game.types';

@ApiTags('game')
@ApiBearerAuth()
@Controller('game')
export class GameController extends BaseController {
    constructor(
        private readonly gameService: GameService,
        private readonly gameTicketService: GameTicketService,
    ) {
        super('GameController');
    }

    @UseGuards(JwtAuthGuard)
    @Post('ticket')
    @ApiOkResponse({ type: GameTicketDTO })
    @ApiOperation({
        summary: 'Game Ticket API',
        description:
            'Socket.IO handshake için kısa ömürlü, tek kullanımlık bilet üretir. Cookie httpOnly + sameSite strict olduğu için tarayıcı access token ile handshake yapamaz.',
    })
    async issueTicket(@Req() req): Promise<BaseResponse<GameTicketDTO>> {
        const user = await this.gameService.loadProfile(req.user.id);
        const { ticket, expiresIn } = await this.gameTicketService.issue(req.user.id);
        return this.createSuccessResponse(
            { data: { ticket, expiresIn, serverNow: Date.now(), user }, message: 'success', success: true },
            req,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('rooms')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOkResponse({ type: [GameRoomSummaryDTO] })
    @ApiOperation({
        summary: 'Game Rooms API',
        description:
            'Verilen share_id için katılıma açık odaları listeler. Kullanıcının o grubu kendi kelime gruplarında bulundurması zorunludur.',
    })
    @ApiBody({ type: GameRoomsRequestDTO })
    async listRooms(@Req() req, @Body() body: GameRoomsRequestDTO): Promise<BaseResponse<RoomSummary[]>> {
        const result = await this.gameService.listRooms(req.user.id, body.share_id);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }
}
