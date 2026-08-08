import { Global, Module } from '@nestjs/common';
import { AuthStateService } from './auth-state.service';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Global()
@Module({
  imports:[DrizzleModule],
  providers: [AuthStateService],
  exports:[AuthStateService]
})
export class AuthStateModule {}
