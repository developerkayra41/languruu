import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserRepository } from "src/users/repository/user.repository";
import { isAdminEmail } from "src/_common/utils/admin-emails";

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(
        private readonly userRepo: UserRepository,
        private readonly config: ConfigService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        if (!req.user?.id) throw new ForbiddenException();

        const user = await this.userRepo.findById(req.user.id);
        if (!user) throw new ForbiddenException();

        if (!isAdminEmail(this.config, user.email)) {
            throw new ForbiddenException("Bu alana erişim yetkiniz yok.");
        }
        return true;
    }
}