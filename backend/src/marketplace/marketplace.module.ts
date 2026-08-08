// marketplace.module.ts
import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { MarketPlaceRepository } from './repository/marketplace.repository';
import { UsersModule } from 'src/users/users.module';
import { WordsModule } from 'src/words/words.module';
import { DrizzleModule } from 'src/_common/drizzle/drizzle.module'; // kendi path'ine göre

@Module({
  imports: [DrizzleModule, WordsModule, UsersModule],   // <- DrizzleModule eklendi
  controllers: [MarketplaceController],
  providers: [MarketplaceService, MarketPlaceRepository],
  exports: [MarketPlaceRepository]
})
export class MarketplaceModule {}