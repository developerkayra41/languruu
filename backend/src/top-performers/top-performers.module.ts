// top-performers.module.ts
import { Module } from '@nestjs/common';
import { TopPerformersService } from './top-performers.service';
import { TopPerformersController } from './top-performers.controller';
import { TopPerformerRepository } from './repository/top-performers.repository';
import { UsersModule } from 'src/users/users.module';
import { WordsModule } from 'src/words/words.module';
import { DrizzleModule } from 'src/_common/drizzle/drizzle.module';
import { TopPerformersTasks } from './tasks/top-performers.tasks';

@Module({
  imports: [UsersModule, WordsModule, DrizzleModule],
  providers: [TopPerformersService, TopPerformerRepository,TopPerformersTasks],  
  controllers: [TopPerformersController]
})
export class TopPerformersModule {}