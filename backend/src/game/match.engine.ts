import { Injectable, Logger } from '@nestjs/common';
import { Namespace } from 'socket.io';
import { RoomRegistry } from './room.registry';
import { GameService } from './game.service';
import { JudgeService } from './judge/judge.service';
import { buildScoreboard, scoreAnswer } from './scoring';
import { GameRoom, RevealPlayerResult } from './game.types';
import {
    ALL_ANSWERED_DELAY_MS,
    ANSWER_GRACE_MS,
    COUNTDOWN_MS,
    DEADLINE_SLACK_MS,
    MAX_ANSWER_LENGTH,
    REVEAL_MS,
} from './game.constants';

@Injectable()
export class MatchEngine {
    private server: Namespace | null = null;
    private readonly logger = new Logger(MatchEngine.name);
    private readonly timers = new Map<string, NodeJS.Timeout>();

    constructor(
        private readonly registry: RoomRegistry,
        private readonly judgeService: JudgeService,
        private readonly gameService: GameService,
    ) { }

    bind(server: Namespace): void {
        this.server = server;
    }

    cancel(code: string): void {
        const timer = this.timers.get(code);
        if (timer) clearTimeout(timer);
        this.timers.delete(code);
    }

    start(room: GameRoom): void {
        room.state = 'countdown';
        room.index = -1;

        const startsAt = Date.now() + COUNTDOWN_MS;
        this.emit(room, 'room:state', this.registry.toRoomView(room));
        this.emit(room, 'game:countdown', { startsAt, serverNow: Date.now() });
        this.schedule(room.code, COUNTDOWN_MS, (next) => this.askNext(next));
    }

    submit(room: GameRoom, userId: number, index: number, rawText: string): void {
        if (room.state !== 'question' || index !== room.index) return;

        const player = room.players.get(userId);
        if (!player || player.answer) return;

        const now = Date.now();
        if (room.deadline === null || now > room.deadline + ANSWER_GRACE_MS) return;

        const question = room.questions[room.index];
        const totalMs = room.secondsPerQuestion * 1000;
        const elapsed = Math.min(totalMs, Math.max(0, now - (room.questionStartedAt ?? now)));
        const text = rawText.slice(0, MAX_ANSWER_LENGTH);
        const verdict = this.judgeService.evaluate(question, text);

        player.answer = { text, ms: elapsed, verdict, points: scoreAnswer(verdict, elapsed, totalMs) };

        const connected = [...room.players.values()].filter((item) => item.socketId !== null);
        const answered = connected.filter((item) => item.answer !== null).length;

        this.emit(room, 'game:answered', {
            index: room.index,
            answeredCount: answered,
            total: connected.length,
        });

        if (connected.length > 0 && answered >= connected.length) {
            this.schedule(room.code, ALL_ANSWERED_DELAY_MS, (next) => this.reveal(next));
        }
    }

    private askNext(room: GameRoom): void {
        if (room.state !== 'countdown' && room.state !== 'reveal') return;

        room.index += 1;
        if (room.index >= room.questions.length) {
            this.finish(room);
            return;
        }

        const question = room.questions[room.index];
        const totalMs = room.secondsPerQuestion * 1000;
        const now = Date.now();

        room.state = 'question';
        room.questionStartedAt = now;
        room.deadline = now + totalMs;
        for (const player of room.players.values()) player.answer = null;

        this.emit(room, 'game:question', {
            index: room.index,
            total: room.questions.length,
            prompt: question.prompt,
            promptLang: question.promptLang,
            answerLang: question.answerLang,
            isSentence: question.isSentence,
            startedAt: now,
            deadline: room.deadline,
            serverNow: now,
        });

        this.schedule(room.code, totalMs + DEADLINE_SLACK_MS, (next) => this.reveal(next));
    }

    private reveal(room: GameRoom): void {
        if (room.state !== 'question') return;

        room.state = 'reveal';
        room.deadline = null;

        const question = room.questions[room.index];
        const totalMs = room.secondsPerQuestion * 1000;
        const results: RevealPlayerResult[] = [];

        for (const player of this.registry.orderedPlayers(room)) {
            const answer = player.answer;
            if (answer) {
                player.score += answer.points;
                player.totalMs += answer.ms;
                if (answer.verdict === 2) player.correct += 1;
            } else {
                player.totalMs += totalMs;
            }

            results.push({
                userId: player.userId,
                answer: answer?.text ?? null,
                verdict: answer?.verdict ?? null,
                points: answer?.points ?? 0,
                ms: answer?.ms ?? null,
            });
        }

        const isLast = room.index + 1 >= room.questions.length;

        this.emit(room, 'game:reveal', {
            index: room.index,
            prompt: question.prompt,
            correctAnswers: question.accepted,
            results,
            scoreboard: buildScoreboard(room),
            nextInMs: REVEAL_MS,
            isLast,
        });

        this.schedule(room.code, REVEAL_MS, (next) => this.askNext(next));
    }

    private finish(room: GameRoom): void {
        room.state = 'finished';
        room.finishedAt = Date.now();
        room.deadline = null;
        room.questionStartedAt = null;
        this.cancel(room.code);

        this.emit(room, 'game:finished', { ranking: buildScoreboard(room) });
        this.emit(room, 'room:state', this.registry.toRoomView(room));

        void this.gameService
            .persistScores(room)
            .then((results) => {
                if (results.length > 0) this.emit(room, 'game:xp', { results });
            })
            .catch((error) =>
                this.logger.error(`Oyun skorları yazılamadı (${room.code})`, error?.stack),
            );
    }

    private schedule(code: string, delayMs: number, action: (room: GameRoom) => void): void {
        this.cancel(code);
        const timer = setTimeout(() => {
            this.timers.delete(code);
            const room = this.registry.get(code);
            if (!room) return;
            action(room);
        }, delayMs);
        this.timers.set(code, timer);
    }

    private emit(room: GameRoom, event: string, payload: unknown): void {
        this.server?.to(room.code).emit(event, payload);
    }
}
