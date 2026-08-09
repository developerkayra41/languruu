import { ExecutionContext } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerLimitDetail } from "@nestjs/throttler";

export class CustomThrottlerGuard extends ThrottlerGuard {
    protected async getErrorMessage(): Promise<string> {
        return 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyip tekrar deneyin.'
    }
}