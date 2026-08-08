import { CallHandler, ExecutionContext, Logger, NestInterceptor } from "@nestjs/common";
import { Request, Response } from "express";
import { Observable, tap } from "rxjs";

export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const req = context.switchToHttp().getRequest<Request>();
        const res = context.switchToHttp().getResponse<Response>();
        const { method, originalUrl } = req;
        const start = Date.now();
        return next.handle().pipe(
            tap(() => {
                const ms = Date.now() - start;
                const userId = (req as any).user?.id ?? '-';

                this.logger.log(`${method} ${originalUrl} ${res.statusCode} ${ms}ms user:${userId}`)
            })
        )

    }
}