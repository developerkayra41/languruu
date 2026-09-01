import { Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { AuthStateService } from 'src/_common/auth-state/auth-state.service';
import { GameTicketService } from './game-ticket.service';
import { GameService } from './game.service';
import { MatchEngine } from './match.engine';
import { RoomRegistry } from './room.registry';
import { GameDirection, GamePlayerProfile, GameRoom, SecondsPerQuestion } from './game.types';
import {
    AUTH_RECHECK_INTERVAL_MS,
    FINISHED_ROOM_TTL_MS,
    GAME_NAMESPACE,
    HOST_TRANSFER_GRACE_MS,
    LOBBY_DISCONNECT_GRACE_MS,
    LOBBY_TTL_MS,
    MATCH_DISCONNECT_GRACE_MS,
    MAX_ANSWER_LENGTH,
    SOCKET_EVENT_KICK_LIMIT,
    SOCKET_EVENT_WARN_LIMIT,
    SOCKET_EVENT_WINDOW_MS,
    SWEEP_INTERVAL_MS,
} from './game.constants';

const ALLOWED_SECONDS: SecondsPerQuestion[] = [10, 20, 30];
const ALLOWED_DIRECTIONS: GameDirection[] = [1, 2, 3];

interface RateBucket {
    windowStart: number;
    count: number;
}

@WebSocketGateway({
    namespace: GAME_NAMESPACE,
    cors: {
        origin: (origin: string | undefined, callback: (err: Error | null, allow: boolean) => void) => {
            const allowed = process.env.FRONTEND_URL ?? 'http://localhost:3000';
            callback(null, !origin || origin === allowed);
        },
        credentials: true,
    },
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Namespace;

    private readonly logger = new Logger(GameGateway.name);
    private readonly socketsByUser = new Map<number, Socket>();

    constructor(
        private readonly ticketService: GameTicketService,
        private readonly authStateService: AuthStateService,
        private readonly gameService: GameService,
        private readonly matchEngine: MatchEngine,
        private readonly registry: RoomRegistry,
    ) { }

    afterInit(server: Namespace): void {
        this.matchEngine.bind(server);
    }

    async handleConnection(client: Socket): Promise<void> {
        try {
            const ticket = client.handshake.auth?.ticket;
            if (typeof ticket !== 'string' || !ticket) {
                this.reject(client, 'INVALID_TICKET');
                return;
            }

            const userId = await this.ticketService.consume(ticket);
            const state = await this.authStateService.getAuthState(userId);
            if (!state || state.deleted_at) {
                this.reject(client, 'INVALID_TICKET');
                return;
            }
            if (state.is_banned) {
                this.reject(client, 'ACCOUNT_SUSPENDED');
                return;
            }

            const profile = await this.gameService.loadProfile(userId);
            client.data.user = profile;
            client.data.events = { windowStart: Date.now(), count: 0 } as RateBucket;

            const previous = this.socketsByUser.get(userId);
            if (previous && previous.id !== client.id) {
                previous.emit('game:error', { code: 'SESSION_REPLACED' });
                previous.disconnect(true);
            }
            this.socketsByUser.set(userId, client);

            client.emit('game:ready', { userId, serverNow: Date.now() });

            const room = this.registry.roomOfUser(userId);
            const player = room?.players.get(userId);
            if (room && player) {
                player.socketId = client.id;
                player.disconnectedAt = null;
                await client.join(room.code);
                this.emitRoomState(room);
            }
        } catch (error) {
            this.reject(client, this.errorCode(error));
        }
    }

    handleDisconnect(client: Socket): void {
        const profile: GamePlayerProfile | undefined = client.data?.user;
        if (!profile) return;

        const current = this.socketsByUser.get(profile.userId);
        if (current?.id === client.id) this.socketsByUser.delete(profile.userId);

        const room = this.gameService.markDisconnected(profile.userId, client.id);
        if (room) this.emitRoomState(room);
    }

    @SubscribeMessage('time:ping')
    handleTimePing(@ConnectedSocket() client: Socket): void {
        if (!this.guard(client)) return;
        client.emit('time:pong', { serverNow: Date.now() });
    }

    @SubscribeMessage('room:create')
    async handleRoomCreate(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: { shareId?: unknown; secondsPerQuestion?: unknown; direction?: unknown },
    ): Promise<void> {
        if (!this.guard(client)) return;
        const profile: GamePlayerProfile = client.data.user;

        const shareId = typeof body?.shareId === 'string' ? body.shareId.trim() : '';
        const seconds = body?.secondsPerQuestion as SecondsPerQuestion;
        const direction = body?.direction as GameDirection;

        if (!shareId || !ALLOWED_SECONDS.includes(seconds) || !ALLOWED_DIRECTIONS.includes(direction)) {
            client.emit('game:error', { code: 'INVALID_PAYLOAD' });
            return;
        }

        try {
            const room = await this.gameService.createRoom(profile, client.id, {
                shareId,
                secondsPerQuestion: seconds,
                direction,
            });
            await client.join(room.code);
            this.emitRoomState(room);
        } catch (error) {
            client.emit('game:error', { code: this.errorCode(error) });
        }
    }

    @SubscribeMessage('room:join')
    async handleRoomJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: { code?: unknown },
    ): Promise<void> {
        if (!this.guard(client)) return;
        const profile: GamePlayerProfile = client.data.user;

        const code = typeof body?.code === 'string' ? body.code.trim() : '';
        if (!code) {
            client.emit('game:error', { code: 'INVALID_PAYLOAD' });
            return;
        }

        try {
            const room = await this.gameService.joinRoom(profile, client.id, code);
            await client.join(room.code);
            this.emitRoomState(room);
        } catch (error) {
            client.emit('game:error', { code: this.errorCode(error) });
        }
    }

    @SubscribeMessage('room:leave')
    async handleRoomLeave(@ConnectedSocket() client: Socket): Promise<void> {
        if (!this.guard(client)) return;
        const profile: GamePlayerProfile = client.data.user;

        const previousCode = this.registry.roomOfUser(profile.userId)?.code;
        const room = this.gameService.leaveRoom(profile.userId);
        if (previousCode) {
            await client.leave(previousCode);
            if (!room) this.matchEngine.cancel(previousCode);
        }
        client.emit('room:left', { code: previousCode ?? null });
        if (room) this.emitRoomState(room);
    }

    @SubscribeMessage('room:start')
    handleRoomStart(@ConnectedSocket() client: Socket): void {
        if (!this.guard(client)) return;
        const profile: GamePlayerProfile = client.data.user;

        try {
            const room = this.gameService.startRoom(profile.userId);
            this.matchEngine.start(room);
        } catch (error) {
            client.emit('game:error', { code: this.errorCode(error) });
        }
    }

    @SubscribeMessage('answer:submit')
    handleAnswerSubmit(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: { index?: unknown; text?: unknown },
    ): void {
        if (!this.guard(client)) return;
        const profile: GamePlayerProfile = client.data.user;

        const index = typeof body?.index === 'number' ? body.index : -1;
        const text = typeof body?.text === 'string' ? body.text.slice(0, MAX_ANSWER_LENGTH) : '';
        if (index < 0) return;

        const room = this.registry.roomOfUser(profile.userId);
        if (!room) return;

        this.matchEngine.submit(room, profile.userId, index, text);
    }

    @Interval(SWEEP_INTERVAL_MS)
    sweep(): void {
        const now = Date.now();

        for (const room of this.registry.all()) {
            let changed = false;
            const grace = room.state === 'lobby' ? LOBBY_DISCONNECT_GRACE_MS : MATCH_DISCONNECT_GRACE_MS;

            for (const player of [...room.players.values()]) {
                if (player.socketId !== null || player.disconnectedAt === null) continue;
                if (now - player.disconnectedAt <= grace) continue;
                this.registry.removePlayer(room, player.userId);
                changed = true;
            }

            if (room.players.size === 0) {
                this.matchEngine.cancel(room.code);
                this.registry.remove(room.code);
                continue;
            }

            if (room.state === 'lobby' && now - room.createdAt > LOBBY_TTL_MS) {
                this.closeRoom(room, 'EXPIRED');
                continue;
            }
            if (room.state === 'finished' && room.finishedAt && now - room.finishedAt > FINISHED_ROOM_TTL_MS) {
                this.closeRoom(room, 'EXPIRED');
                continue;
            }

            const host = room.players.get(room.hostUserId);
            const hostGone =
                !host ||
                (host.socketId === null &&
                    host.disconnectedAt !== null &&
                    now - host.disconnectedAt > HOST_TRANSFER_GRACE_MS);

            if (hostGone) {
                const before = room.hostUserId;
                this.gameService.transferHost(room);
                if (room.hostUserId !== before) changed = true;
            }

            if (changed) this.emitRoomState(room);
        }
    }

    @Interval(AUTH_RECHECK_INTERVAL_MS)
    async recheckAuth(): Promise<void> {
        for (const [userId, socket] of [...this.socketsByUser]) {
            try {
                const state = await this.authStateService.getAuthState(userId);
                if (state && !state.deleted_at && !state.is_banned) continue;
                socket.emit('game:error', { code: state?.is_banned ? 'ACCOUNT_SUSPENDED' : 'INVALID_TICKET' });
                socket.disconnect(true);
            } catch {
                this.logger.warn(`Auth kontrolü başarısız (user ${userId})`);
            }
        }
    }

    private emitRoomState(room: GameRoom): void {
        this.server.to(room.code).emit('room:state', this.registry.toRoomView(room));
    }

    private closeRoom(room: GameRoom, reason: string): void {
        this.matchEngine.cancel(room.code);
        this.server.to(room.code).emit('room:closed', { reason });
        this.server.in(room.code).socketsLeave(room.code);
        this.registry.remove(room.code);
    }

    private guard(client: Socket): boolean {
        if (!client.data?.user) {
            this.reject(client, 'INVALID_TICKET');
            return false;
        }

        const bucket: RateBucket = client.data.events;
        const now = Date.now();
        if (now - bucket.windowStart > SOCKET_EVENT_WINDOW_MS) {
            bucket.windowStart = now;
            bucket.count = 0;
        }
        bucket.count += 1;

        if (bucket.count > SOCKET_EVENT_KICK_LIMIT) {
            this.reject(client, 'RATE_LIMITED');
            return false;
        }
        if (bucket.count > SOCKET_EVENT_WARN_LIMIT) {
            client.emit('game:error', { code: 'RATE_LIMITED' });
            return false;
        }
        return true;
    }

    private reject(client: Socket, code: string): void {
        client.emit('game:error', { code });
        client.disconnect(true);
    }

    private errorCode(error: unknown): string {
        const response = (error as { response?: { message?: string } })?.response;
        if (typeof response?.message === 'string') return response.message;
        const message = (error as { message?: string })?.message;
        return typeof message === 'string' && /^[A-Z_]+$/.test(message) ? message : 'GAME_ERROR';
    }
}
