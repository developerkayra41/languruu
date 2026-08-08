import { Body, Controller, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseController } from 'src/_base/base.controller';
import { UsersService } from 'src/users/users.service';
import { WordsService } from './words.service';
import { GetWordsRequestDTO } from './dto/request/GetWords.request.dto';
import { UpsertWordRequestDTO } from './dto/request/UpsertWord.request.dto';
import { JwtAuthGuard } from 'src/_common/guards/JwtAuthGuard';
import { BaseResponse } from 'src/_base/base.response';
import { WordColumn, WordColumnWithoutPool } from 'src/_common/types/words.type';
import { WordColumnResponseDTO } from './dto/response/Words.response.dto';
import { WordColumnDTO, WordColumnWithoutPoolDTO } from './dto/response/Words.dto';
import { TopPerformersDTO } from 'src/top-performers/dto/TopPerformers.response.dto';

@ApiTags('words')
@ApiBearerAuth()
@Controller('words')
export class WordsController extends BaseController {
  constructor(
    private readonly wordsService: WordsService,
    // private readonly usersService: UsersService,
  ) {
    super('WordsController');
  }

  @UseGuards(JwtAuthGuard)
  @Post('')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOkResponse({ type: WordColumnResponseDTO })
  @ApiOperation({ summary: 'Words API', description: 'Bu API User IDye göre kelimeleri getirir' })
  @ApiBody({ type: GetWordsRequestDTO })
  async getWordsByUserId(
    @Req() req,
    @Body() body: GetWordsRequestDTO,
  ): Promise<BaseResponse<WordColumn>> {
    const result: WordColumn = await this.wordsService.getWordsById(req.user.id, body.word_id);
    return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('wordsInfo')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOkResponse({ type: [WordColumnWithoutPoolDTO] })
  @ApiOperation({ summary: 'WordsInfo API', description: 'Bu API User IDye göre bütün kelimelerin havuzları hariç diğer bilgilerini getirir' })
  async getWordsInfo(@Req() req): Promise<BaseResponse<WordColumnWithoutPool[]>> {
    const result: WordColumnWithoutPool[] = await this.wordsService.getWordsInfo(req.user.id);
    return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upsertWord')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOkResponse({ type: WordColumnDTO })
  @ApiOperation({ summary: 'UpsertWord API', description: 'Bu API User IDye göre her user için kelime varsa günceller, yoksa words tablosuna yeni bir kayıt düşer' })
  @ApiBody({ type: UpsertWordRequestDTO })
  async updateWordPoolByWordId(
    @Req() req,
    @Body() body: UpsertWordRequestDTO,
  ): Promise<BaseResponse<WordColumn>> {
    const result: WordColumn = await this.wordsService.upsertWord(req.user.id, body.words);
    return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
  }
}
