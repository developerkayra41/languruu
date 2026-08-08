import { AuthStateService } from './../auth-state/auth-state.service';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService, private authStateService: AuthStateService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {

        const req = context.switchToHttp().getRequest();
        const authHeader = req.headers['authorization'];
        if (!authHeader) throw new UnauthorizedException();
        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer' || !token) throw new UnauthorizedException();

        // SADECE JWT doğrulaması try/catch içinde olmalı; aşağıdaki iş kuralları
        // (ban/silme/token geçerliliği) DEĞİL — yoksa ForbiddenException catch'e
        // düşüp yanlışlıkla 401'e dönüşür ve frontend ban'i ayırt edemez.
        let payload: any;
        try {
            payload = await this.jwtService.verifyAsync(token);
        } catch {
            throw new UnauthorizedException();
        }
        if (!payload?.sub) throw new UnauthorizedException();

        const state = await this.authStateService.getAuthState(payload.sub);
        if (!state || state.deleted_at) throw new UnauthorizedException();
        if (state.is_banned) throw new ForbiddenException("ACCOUNT_SUSPENDED");
        if (state.token_valid_after && payload.iat * 1000 < state.token_valid_after.getTime()) {
            throw new UnauthorizedException();
        }

        req.user = { id: payload.sub };
        return true;


    }
}