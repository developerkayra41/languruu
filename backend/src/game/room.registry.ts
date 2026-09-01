import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { GamePlayer, GameRoom, PlayerView, RoomSummary, RoomView } from './game.types';
import { MAX_PLAYERS, MIN_PLAYERS, ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from './game.constants';

@Injectable()
export class RoomRegistry {
    private readonly rooms = new Map<string, GameRoom>();
    private readonly codesByShareId = new Map<string, Set<string>>();
    private readonly roomCodeByUser = new Map<number, string>();

    generateCode(): string {
        for (let attempt = 0; attempt < 50; attempt++) {
            let code = '';
            for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
                code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
            }
            if (!this.rooms.has(code)) return code;
        }
        throw new Error('Oda kodu üretilemedi');
    }

    add(room: GameRoom): void {
        this.rooms.set(room.code, room);
        let codes = this.codesByShareId.get(room.shareId);
        if (!codes) {
            codes = new Set<string>();
            this.codesByShareId.set(room.shareId, codes);
        }
        codes.add(room.code);
    }

    get(code: string): GameRoom | null {
        return this.rooms.get(code) ?? null;
    }

    all(): GameRoom[] {
        return [...this.rooms.values()];
    }

    remove(code: string): void {
        const room = this.rooms.get(code);
        if (!room) return;
        for (const userId of room.players.keys()) {
            if (this.roomCodeByUser.get(userId) === code) this.roomCodeByUser.delete(userId);
        }
        const codes = this.codesByShareId.get(room.shareId);
        if (codes) {
            codes.delete(code);
            if (codes.size === 0) this.codesByShareId.delete(room.shareId);
        }
        this.rooms.delete(code);
    }

    joinableRooms(shareId: string): GameRoom[] {
        const codes = this.codesByShareId.get(shareId);
        if (!codes) return [];
        return [...codes]
            .map((code) => this.rooms.get(code))
            .filter((room): room is GameRoom => !!room && room.state === 'lobby')
            .sort((a, b) => b.createdAt - a.createdAt);
    }

    roomOfUser(userId: number): GameRoom | null {
        const code = this.roomCodeByUser.get(userId);
        if (!code) return null;
        const room = this.rooms.get(code);
        if (!room) {
            this.roomCodeByUser.delete(userId);
            return null;
        }
        return room;
    }

    bindUser(userId: number, code: string): void {
        this.roomCodeByUser.set(userId, code);
    }

    unbindUser(userId: number): void {
        this.roomCodeByUser.delete(userId);
    }

    removePlayer(room: GameRoom, userId: number): void {
        room.players.delete(userId);
        if (this.roomCodeByUser.get(userId) === room.code) this.roomCodeByUser.delete(userId);
    }

    toPlayerView(room: GameRoom, player: GamePlayer): PlayerView {
        return {
            userId: player.userId,
            userName: player.userName,
            fullName: player.fullName,
            avatarUrl: player.avatarUrl,
            isHost: player.userId === room.hostUserId,
            connected: player.socketId !== null,
            score: player.score,
        };
    }

    orderedPlayers(room: GameRoom): GamePlayer[] {
        return [...room.players.values()].sort((a, b) => a.joinedAt - b.joinedAt);
    }

    toRoomView(room: GameRoom): RoomView {
        return {
            code: room.code,
            shareId: room.shareId,
            groupName: room.groupName,
            languages: room.languages,
            state: room.state,
            secondsPerQuestion: room.secondsPerQuestion,
            direction: room.direction,
            questionCount: room.questions.length,
            index: room.index,
            hostUserId: room.hostUserId,
            players: this.orderedPlayers(room).map((player) => this.toPlayerView(room, player)),
            maxPlayers: MAX_PLAYERS,
            minPlayers: MIN_PLAYERS,
        };
    }

    toRoomSummary(room: GameRoom): RoomSummary {
        const host = room.players.get(room.hostUserId);
        return {
            code: room.code,
            shareId: room.shareId,
            groupName: room.groupName,
            languages: room.languages,
            hostUserName: host?.userName ?? '',
            hostFullName: host?.fullName ?? '',
            playerCount: room.players.size,
            maxPlayers: MAX_PLAYERS,
            secondsPerQuestion: room.secondsPerQuestion,
            questionCount: room.questions.length,
            createdAt: room.createdAt,
        };
    }
}
