import { Body, Controller, Post, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseController } from 'src/_base/base.controller';
import { ReengagementService } from './reengagement.service';
import { UnsubscribeRequestDTO } from './dto/Unsubscribe.request.dto';

@ApiTags('reengagement')
@Controller('reengagement')
export class ReengagementController extends BaseController {
    constructor(private readonly reengagementService: ReengagementService) {
        super('ReengagementController');
    }

    @Post('unsubscribe')
    @Throttle({ default: { ttl: 60_000, limit: 10 } })
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiBody({ type: UnsubscribeRequestDTO })
    @ApiOperation({ summary: 'unsubscribe API', description: 'Hatırlatma e-postasındaki imzalı bağlantıyla hatırlatma aboneliğini kapatır' })
    async unsubscribe(@Req() req, @Body() body: UnsubscribeRequestDTO) {
        const result = await this.reengagementService.unsubscribe(body.token);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }
}
