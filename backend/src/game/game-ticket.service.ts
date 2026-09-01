import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { GAME_TICKET_AUDIENCE, TICKET_TTL_SECONDS } from './game.constants';

@Injectable()
export class GameTicketService {
    private readonly consumedJtis = new Map<string, number>();

    constructor(private readonly jwtService: JwtService) { }

    async issue(userId: number): Promise<{ ticket: string; expiresIn: number }> {
        const ticket = await this.jwtService.signAsync(
            { sub: userId, jti: randomUUID() },
            { expiresIn: TICKET_TTL_SECONDS, audience: GAME_TICKET_AUDIENCE },
        );
        return { ticket, expiresIn: TICKET_TTL_SECONDS };
    }

    async consume(ticket: string): Promise<number> {
        this.prune();

        let payload: { sub?: number; jti?: string };
        try {
            payload = await this.jwtService.verifyAsync(ticket, { audience: GAME_TICKET_AUDIENCE });
        } catch {
            throw new UnauthorizedException('INVALID_TICKET');
        }

        if (!payload?.sub || !payload?.jti) throw new UnauthorizedException('INVALID_TICKET');
        if (this.consumedJtis.has(payload.jti)) throw new UnauthorizedException('TICKET_ALREADY_USED');

        this.consumedJtis.set(payload.jti, Date.now() + TICKET_TTL_SECONDS * 1000);
        return payload.sub;
    }

    private prune(): void {
        const now = Date.now();
        for (const [jti, expiresAt] of this.consumedJtis) {
            if (expiresAt <= now) this.consumedJtis.delete(jti);
        }
    }
}
