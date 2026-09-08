import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/_common/drizzle/drizzle.module';
import { MailModule } from 'src/mail/mail.module';
import { UserRepository } from 'src/users/repository/user.repository';
import { ReengagementController } from './reengagement.controller';
import { ReengagementService } from './reengagement.service';
import { ReengagementTasks } from './tasks/reengagement.tasks';

@Module({
    imports: [DrizzleModule, MailModule],
    controllers: [ReengagementController],
    providers: [ReengagementService, ReengagementTasks, UserRepository],
    exports: [ReengagementService],
})
export class ReengagementModule { }
