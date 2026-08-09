import { Injectable } from "@nestjs/common";
import { UserRepository } from "src/users/repository/user.repository";
import { UserSessionRepository } from "src/auth/repository/user-session.repository";

@Injectable()
export class AdminService {
    constructor(
        private readonly userRepo: UserRepository,
        private readonly userSessionRepo: UserSessionRepository,
    ) { }

    async banUser(userId: number): Promise<void> {
        await this.userRepo.setBanned(userId, true);
        await this.userSessionRepo.revokeAllForUser(userId);
    }

    async unbanUser(userId: number): Promise<void> {
        await this.userRepo.setBanned(userId, false);
    }
}