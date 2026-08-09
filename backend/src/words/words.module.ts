import { Module } from '@nestjs/common';
import { WordsService } from './words.service';
import { WordsController } from './words.controller';
import { WordRepository } from './repository/words.repository';
import { DrizzleModule } from 'src/_common/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  providers: [WordsService, WordRepository],
  controllers: [WordsController],
  exports: [WordRepository, WordsService]
})
export class WordsModule {}