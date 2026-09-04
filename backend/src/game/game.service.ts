import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { WordRepository } from 'src/words/repository/words.repository';
import { MarketPlaceRepository } from 'src/marketplace/repository/marketplace.repository';
import { UserRepository } from 'src/users/repository/user.repository';
import { WordColumn } from 'src/_common/types/words.type';
import { RoomRegistry } from './room.registry';
import { DAILY_XP_CAP, levelFromXp, levelInfo, xpFromGameScore } from 'src/_common/utils/xp-level';
import { GameXpResult } from './game.types';
import {
    GameDirection,
    GamePlayer,
    GamePlayerProfile,
    GameQuestion,
    GameRoom,
    RoomSummary,
    SecondsPerQuestion,
} from './game.types';
import {
    MAX_PLAYERS,
    MAX_QUESTIONS,
    MIN_PLAYERS,
    MIN_QUESTIONS,
    SENTENCE_TOKEN_THRESHOLD,
} from './game.constants';
import { cleanList, pickRandom, shuffle, tokenCount } from './game.utils';

@Injectable()
export class GameService {
    constructor(
        private readonly registry: RoomRegistry,
        private readonly wordRepository: WordRepository,
        private readonly marketplaceRepository: MarketPlaceRepository,
        private readonly userRepository: UserRepository,
    ) { }

    async loadProfile(userId: number): Promise<GamePlayerProfile> {
        const [user] = await this.userRepository.getUsersByIds([userId]);
        if (!user) throw new NotFoundException('USER_NOT_FOUND');
        return {
            userId: user.id,
            userName: user.user_name,
            fullName: user.full_name,
            avatarUrl: user.avatar_url ?? undefined,
        };
    }

    async assertEligible(userId: number, shareId: string): Promise<void> {
        const row = await this.wordRepository.getWordsByUserId(userId);
        const owns = (row?.words ?? []).some(
            (column) => column.shareId === shareId || column.sourceShareId === shareId,
        );
        if (!owns) throw new ForbiddenException('GROUP_NOT_OWNED');
    }

    private async loadSourceColumn(shareId: string): Promise<WordColumn> {
        const entry = await this.marketplaceRepository.findByShareId(shareId);
        if (!entry) throw new NotFoundException('SHARE_NOT_FOUND');

        const ownerWords = await this.wordRepository.getWordsByUserId(entry.owner_user_id);
        const column = (ownerWords?.words ?? []).find((item) => item.shareId === shareId);
        if (!column) throw new NotFoundException('SHARE_NOT_FOUND');

        return column;
    }

    private buildQuestions(column: WordColumn, direction: GameDirection): GameQuestion[] {
        const termLang = column.languages?.[0] ?? '';
        const translationLang = column.languages?.[1] ?? '';

        const usable = (column.wordPool ?? []).filter(
            (pool) => cleanList(pool.term).length > 0 && cleanList(pool.translation).length > 0,
        );

        return shuffle(usable)
            .slice(0, MAX_QUESTIONS)
            .map((pool) => {
                const terms = cleanList(pool.term);
                const translations = cleanList(pool.translation);
                const termToTranslation =
                    direction === 1 ? true : direction === 2 ? false : Math.random() < 0.5;

                const source = termToTranslation ? terms : translations;
                const accepted = termToTranslation ? translations : terms;

                return {
                    prompt: pickRandom(source),
                    accepted,
                    promptLang: termToTranslation ? termLang : translationLang,
                    answerLang: termToTranslation ? translationLang : termLang,
                    isSentence: tokenCount(accepted[0]) > SENTENCE_TOKEN_THRESHOLD,
                };
            });
    }

    private createPlayer(profile: GamePlayerProfile, socketId: string | null): GamePlayer {
        return {
            ...profile,
            socketId,
            score: 0,
            correct: 0,
            totalMs: 0,
            joinedAt: Date.now(),
            disconnectedAt: null,
            answer: null,
        };
    }

    startRoom(userId: number): GameRoom {
        const room = this.registry.roomOfUser(userId);
        if (!room) throw new NotFoundException('ROOM_NOT_FOUND');
        if (room.hostUserId !== userId) throw new ForbiddenException('NOT_HOST');
        if (room.state !== 'lobby') throw new BadRequestException('ROOM_ALREADY_STARTED');

        const connected = [...room.players.values()].filter((player) => player.socketId !== null).length;
        if (connected < MIN_PLAYERS) throw new BadRequestException('NOT_ENOUGH_PLAYERS');

        return room;
    }

    async listRooms(userId: number, shareId: string): Promise<RoomSummary[]> {
        await this.assertEligible(userId, shareId);
        return this.registry
            .joinableRooms(shareId)
            .map((room) => this.registry.toRoomSummary(room));
    }

    async createRoom(
        profile: GamePlayerProfile,
        socketId: string,
        options: {
            shareId: string;
            secondsPerQuestion: SecondsPerQuestion;
            direction: GameDirection;
        },
    ): Promise<GameRoom> {
        const existing = this.registry.roomOfUser(profile.userId);
        if (existing) throw new BadRequestException('ALREADY_IN_ROOM');

        await this.assertEligible(profile.userId, options.shareId);

        const column = await this.loadSourceColumn(options.shareId);
        const questions = this.buildQuestions(column, options.direction);
        if (questions.length < MIN_QUESTIONS) throw new BadRequestException('GROUP_TOO_SMALL');

        const room: GameRoom = {
            code: this.registry.generateCode(),
            shareId: options.shareId,
            groupName: column.name,
            languages: column.languages ?? [],
            hostUserId: profile.userId,
            secondsPerQuestion: options.secondsPerQuestion,
            direction: options.direction,
            state: 'lobby',
            questions,
            index: -1,
            questionStartedAt: null,
            deadline: null,
            players: new Map(),
            createdAt: Date.now(),
            finishedAt: null,
        };

        room.players.set(profile.userId, this.createPlayer(profile, socketId));
        this.registry.add(room);
        this.registry.bindUser(profile.userId, room.code);

        return room;
    }

    async joinRoom(profile: GamePlayerProfile, socketId: string, code: string): Promise<GameRoom> {
        const room = this.registry.get(code.trim().toUpperCase());
        if (!room) throw new NotFoundException('ROOM_NOT_FOUND');

        const alreadyIn = room.players.get(profile.userId);
        if (alreadyIn) {
            alreadyIn.socketId = socketId;
            alreadyIn.disconnectedAt = null;
            this.registry.bindUser(profile.userId, room.code);
            return room;
        }

        const otherRoom = this.registry.roomOfUser(profile.userId);
        if (otherRoom && otherRoom.code !== room.code) throw new BadRequestException('ALREADY_IN_ROOM');

        if (room.state !== 'lobby') throw new BadRequestException('ROOM_ALREADY_STARTED');
        if (room.players.size >= MAX_PLAYERS) throw new BadRequestException('ROOM_FULL');

        await this.assertEligible(profile.userId, room.shareId);

        room.players.set(profile.userId, this.createPlayer(profile, socketId));
        this.registry.bindUser(profile.userId, room.code);

        return room;
    }

    leaveRoom(userId: number): GameRoom | null {
        const room = this.registry.roomOfUser(userId);
        if (!room) return null;

        this.registry.removePlayer(room, userId);

        if (room.players.size === 0) {
            this.registry.remove(room.code);
            return null;
        }

        if (room.hostUserId === userId) this.transferHost(room);
        return room;
    }

    transferHost(room: GameRoom): void {
        const candidates = this.registry
            .orderedPlayers(room)
            .filter((player) => player.socketId !== null);
        const next = candidates[0] ?? this.registry.orderedPlayers(room)[0];
        if (next) room.hostUserId = next.userId;
    }

    async persistScores(room: GameRoom): Promise<GameXpResult[]> {
        const scorers = [...room.players.values()].filter((player) => player.score > 0);
        const results = await Promise.all(
            scorers.map(async (player) => {
                await this.userRepository.addGameScore(player.userId, player.score);
                const requested = xpFromGameScore(player.score);
                if (requested <= 0) return null;

                const { xp, gained } = await this.userRepository.awardXp(player.userId, requested, DAILY_XP_CAP);
                const info = levelInfo(xp);
                return {
                    userId: player.userId,
                    gained,
                    level: info.level,
                    xpIntoLevel: info.xp_into_level,
                    xpForNext: info.xp_for_next,
                    leveledUp: info.level > levelFromXp(xp - gained),
                } satisfies GameXpResult;
            }),
        );
        return results.filter((result): result is GameXpResult => result !== null);
    }

    markDisconnected(userId: number, socketId: string): GameRoom | null {
        const room = this.registry.roomOfUser(userId);
        if (!room) return null;

        const player = room.players.get(userId);
        if (!player || player.socketId !== socketId) return null;

        player.socketId = null;
        player.disconnectedAt = Date.now();
        return room;
    }
}
