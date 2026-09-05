import { Module } from "@nestjs/common";
import { DrizzleModule } from "src/_common/drizzle/drizzle.module";
import { UsersModule } from "src/users/users.module";
import { AdminController } from "./admin.controller";
import { AdminRepository } from "./admin.repository";
import { AdminGuard } from "src/_common/guards/AdminGuard";
import { AdminService } from './admin.service';
import { AuthModule } from "src/auth/auth.module";
import { ReportsModule } from "src/reports/reports.module";
import { GlobalChatModule } from "src/global-chat/global-chat.module";

@Module({
    imports: [DrizzleModule, UsersModule, AuthModule, ReportsModule, GlobalChatModule],
    controllers: [AdminController],
    providers: [AdminRepository, AdminGuard, AdminService],
})
export class AdminModule {}