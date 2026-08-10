import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import { BaseResponse } from "src/_base/base.response";
import { ResponseMessages } from "../enums/ResponseMessages.enum";
import { DtoPrefix } from "../enums/ValidationMessages.enum";
import { ErrorLogRepository } from "./error-log.repository";
import { MailService } from "src/mail/mail.service";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
const DEFAULT_HTTP_MESSAGES = [
    'Bad Request',
    'Unauthorized',
    'Forbidden',
    'Not Found',
    'Conflict',
    'Internal Server Error',
    'Bad Gateway',
];

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger('ExceptionFilter')
    private readonly alertThrottle = new Map<string, number>();
    constructor(
        private readonly errorLogRepo: ErrorLogRepository,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
        private readonly config: ConfigService,
    ) { }

    private maybeAlert(err: Error, context: { path?: string; method?: string; userId?: number | null }) {
        const to = this.config.get<string>("mail.ALERT_EMAIL");
        if (!to) return;
        const key = err.message.slice(0, 200);
        const now = Date.now();
        const last = this.alertThrottle.get(key) ?? 0;
        if (now - last < 10 * 60 * 1000) return;
        this.alertThrottle.set(key, now);
        void this.mailService.sendErrorAlert(to, { message: err.message, stack: err.stack, ...context });
    }

    catch(exception: unknown, host: ArgumentsHost) {

        const ctx = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();
        const request: Request = ctx.getRequest<Request>();

        if (!(exception instanceof HttpException)) {
            const err = exception instanceof Error ? exception : new Error(String(exception));
            const userId = (request as any).user?.id ?? null;
            void this.errorLogRepo.log({
                message: err.message,
                stack: err.stack,
                path: request.originalUrl,
                method: request.method,
                status: 500,
                user_id: userId
            });

            this.maybeAlert(err, { path: request.originalUrl, method: request.method, userId });

            this.logger.error(
                `${request.method} ${request.originalUrl} 500 - beklenmeyen hata`,
                exception instanceof Error ? exception.stack : String(exception)
            )
            response
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json(new BaseResponse(null, ResponseMessages.INTERNAL_SERVER_ERROR, false));

            return;
        }

        const status = exception.getStatus();

        if (status >= 500) this.logger.error(`${request.method} ${request.originalUrl} ${status} - ${exception.message}`, exception.stack);
        else this.logger.debug(`${request.method} ${request.originalUrl} ${status} - ${exception.message}`);

        const prefixList: DtoPrefix[] = Object.values(DtoPrefix);
        const isValidationMessage = prefixList.find(prefix => exception.message && exception.message.startsWith(prefix))

        if (isValidationMessage) {
            response.status(status).json(new BaseResponse(null, exception.message, false));
            return;
        }

        const isCustomMessage = exception.message && !DEFAULT_HTTP_MESSAGES.includes(exception.message);

        if (isCustomMessage) {
            response.status(status).json(new BaseResponse(null, exception.message, false));
            return;
        }

        let responseMessage: string;
        switch (status) {
            case 404: responseMessage = ResponseMessages.NOT_FOUND; break;
            case 500: responseMessage = ResponseMessages.INTERNAL_SERVER_ERROR; break;
            case 401: responseMessage = ResponseMessages.UNAUTH; break;
            default: responseMessage = ResponseMessages.BAD_GATEWAY; break;
        }
        response.status(status).json(new BaseResponse(null, responseMessage, false));
    }
}