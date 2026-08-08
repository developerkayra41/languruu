import { ExecutionContext } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerLimitDetail } from "@nestjs/throttler";

export class CustomThrottlerGuard extends ThrottlerGuard {
    // 429 durumunda istemciye dönecek. expcetionfilter bunu custom mesaj olarak yakalayacak
    protected async getErrorMessage(): Promise<string> {
        return 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyip tekrar deneyin.'
    }
}