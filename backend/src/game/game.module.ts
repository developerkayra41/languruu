import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/_common/drizzle/drizzle.module';
import { WordsModule } from 'src/words/words.module';
import { MarketplaceModule } from 'src/marketplace/marketplace.module';
import { UsersModule } from 'src/users/users.module';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameTicketService } from './game-ticket.service';
import { GameGateway } from './game.gateway';
import { MatchEngine } from './match.engine';
import { JudgeService } from './judge/judge.service';
import { RoomRegistry } from './room.registry';

@Module({
  imports: [DrizzleModule, WordsModule, MarketplaceModule, UsersModule],
  controllers: [GameController],
  providers: [GameGateway, GameService, GameTicketService, MatchEngine, JudgeService, RoomRegistry],
  exports: [GameService, RoomRegistry],
})
export class GameModule { }
