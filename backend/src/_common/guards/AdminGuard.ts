import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserRepository } from "src/users/repository/user.repository";

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

        const admins = (this.config.get<string>('app.ADMIN_EMAILS') ?? '')
            .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

        if (!admins.includes(user.email.toLowerCase())) {
            throw new ForbiddenException("Bu alana erişim yetkiniz yok.");
        }
        return true;
    }
}