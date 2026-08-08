import { Body, Controller, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/_common/guards/JwtAuthGuard';
import { BaseController } from 'src/_base/base.controller';
import { MarketplaceService } from './marketplace.service';
import { SearchMarketplaceRequestDTO } from './dto/request/SearchMarketplace.request.dto';
import { ShareIdRequestDTO } from './dto/request/ShareId.request.dto';

@ApiTags('marketplace')
@ApiBearerAuth()
@Controller('marketplace')
export class MarketplaceController extends BaseController {
    constructor(private readonly marketplaceService: MarketplaceService) {
        super('MarketplaceController');
    }

    @UseGuards(JwtAuthGuard)
    @Post('search')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOperation({ summary: 'Search Marketplace' })
    @ApiBody({ type: SearchMarketplaceRequestDTO })
    async search(@Req() req, @Body() body: SearchMarketplaceRequestDTO) {
        const result = await this.marketplaceService.search(body, req.user.id);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @UseGuards(JwtAuthGuard)
    @Post('unshare')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOperation({ summary: 'Unshare The Pool' })
    @ApiBody({ type: ShareIdRequestDTO })
    async unshare(@Req() req, @Body() body: ShareIdRequestDTO) {
        const result = await this.marketplaceService.unshareOwnEntry(req.user.id, body.share_id);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @UseGuards(JwtAuthGuard)
    @Post('pool-detail')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOperation({ summary: 'Pool Detail' })
    @ApiBody({ type: ShareIdRequestDTO })
    async poolDetail(@Req() req, @Body() body: ShareIdRequestDTO) {
        const result = await this.marketplaceService.getPoolDetail(body.share_id);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }

    @UseGuards(JwtAuthGuard)
    @Post('copy')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOperation({ summary: 'Copy Pool' })
    @ApiBody({ type: ShareIdRequestDTO })
    async copy(@Req() req, @Body() body: ShareIdRequestDTO) {
        const result = await this.marketplaceService.copyToUser(req.user.id, body.share_id);
        return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
    }
}