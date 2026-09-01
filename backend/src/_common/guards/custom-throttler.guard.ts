import { ExecutionContext } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerLimitDetail } from "@nestjs/throttler";

export class CustomThrottlerGuard extends ThrottlerGuard {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (context.getType() !== 'http') return true;
        return super.canActivate(context);
    }

    protected async getErrorMessage(): Promise<string> {
        return 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyip tekrar deneyin.'
    }
}
