import { BaseResponse } from 'src/_base/base.response';
import { Controller, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/_common/guards/JwtAuthGuard';
import { TopPerformersDTO } from './dto/TopPerformers.response.dto';
import { BaseController } from 'src/_base/base.controller';
import { TopPerformersService } from './top-performers.service';
import { TopPerformerData } from 'src/_common/types/top-performers.type';

@ApiTags('top-performers')
@Controller('top-performers')
export class TopPerformersController extends BaseController {
    constructor(private readonly topPerformersService: TopPerformersService) { super('top-performers') }

    @UseGuards(JwtAuthGuard)
    @Post('')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOkResponse({ type: [TopPerformersDTO] })
    @ApiOperation({ summary: 'TopPerformers API', description: 'Bu API top performers listesini getirir' })
    async getTopPerformers(@Req() req): Promise<BaseResponse<TopPerformersDTO[]>> {
        const result = await this.topPerformersService.getTopPerformers()
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req)
    }
}
