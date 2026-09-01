import { BASE_POINTS, CLOSE_MULTIPLIER, SPEED_POINTS } from './game.constants';
import { GamePlayer, GameRoom, ScoreboardRow, Verdict } from './game.types';

export function scoreAnswer(verdict: Verdict, elapsedMs: number, totalMs: number): number {
    if (verdict === 0) return 0;

    const remaining = Math.max(0, totalMs - Math.max(0, elapsedMs));
    const speed = totalMs > 0 ? Math.round((SPEED_POINTS * remaining) / totalMs) : 0;
    const full = BASE_POINTS + speed;

    return verdict === 2 ? full : Math.round(full * CLOSE_MULTIPLIER);
}

export function buildScoreboard(room: GameRoom): ScoreboardRow[] {
    const rows = [...room.players.values()]
        .sort(comparePlayers)
        .map((player, index) => ({
            userId: player.userId,
            userName: player.userName,
            fullName: player.fullName,
            avatarUrl: player.avatarUrl,
            score: player.score,
            correct: player.correct,
            totalMs: player.totalMs,
            connected: player.socketId !== null,
            rank: index + 1,
        }));

    for (let i = 1; i < rows.length; i++) {
        const previous = rows[i - 1];
        const current = rows[i];
        if (
            current.score === previous.score &&
            current.correct === previous.correct &&
            current.totalMs === previous.totalMs
        ) {
            current.rank = previous.rank;
        }
    }

    return rows;
}

function comparePlayers(a: GamePlayer, b: GamePlayer): number {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correct !== a.correct) return b.correct - a.correct;
    return a.totalMs - b.totalMs;
}
