import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { UserRepository } from "src/users/repository/user.repository";

@Injectable()
export class PresenceInterceptor implements NestInterceptor {
    private readonly lastWrite = new Map<number, number>();
    constructor(private readonly userRepo: UserRepository) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        if (context.getType() !== 'http') return next.handle();

        const req = context.switchToHttp().getRequest();
        const userId = req.user?.id;
        if (userId) {
            const now = Date.now();
            const last = this.lastWrite.get(userId) ?? 0;
            if (now - last > 2 * 60 * 1000) {
                this.lastWrite.set(userId, now);
                void this.userRepo.updateLastSeen(userId).catch(() => {});
            }
        }
        return next.handle();
    }
}
