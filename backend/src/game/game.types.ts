export type GameDirection = 1 | 2 | 3;
export type SecondsPerQuestion = 10 | 20 | 30;
export type RoomState = 'lobby' | 'countdown' | 'question' | 'reveal' | 'finished';
export type Verdict = 0 | 1 | 2;

export interface GameQuestion {
    prompt: string;
    accepted: string[];
    promptLang: string;
    answerLang: string;
    isSentence: boolean;
}

export interface PlayerAnswer {
    text: string;
    ms: number;
    verdict: Verdict;
    points: number;
}

export interface GamePlayerProfile {
    userId: number;
    userName: string;
    fullName: string;
    avatarUrl?: string;
}

export interface GamePlayer extends GamePlayerProfile {
    socketId: string | null;
    score: number;
    correct: number;
    totalMs: number;
    joinedAt: number;
    disconnectedAt: number | null;
    answer: PlayerAnswer | null;
}

export interface GameRoom {
    code: string;
    shareId: string;
    groupName: string;
    languages: string[];
    hostUserId: number;
    secondsPerQuestion: SecondsPerQuestion;
    direction: GameDirection;
    state: RoomState;
    questions: GameQuestion[];
    index: number;
    questionStartedAt: number | null;
    deadline: number | null;
    players: Map<number, GamePlayer>;
    createdAt: number;
    finishedAt: number | null;
}

export interface PlayerView {
    userId: number;
    userName: string;
    fullName: string;
    avatarUrl?: string;
    isHost: boolean;
    connected: boolean;
    score: number;
}

export interface RoomView {
    code: string;
    shareId: string;
    groupName: string;
    languages: string[];
    state: RoomState;
    secondsPerQuestion: SecondsPerQuestion;
    direction: GameDirection;
    questionCount: number;
    index: number;
    hostUserId: number;
    players: PlayerView[];
    maxPlayers: number;
    minPlayers: number;
}

export interface RoomSummary {
    code: string;
    shareId: string;
    groupName: string;
    languages: string[];
    hostUserName: string;
    hostFullName: string;
    playerCount: number;
    maxPlayers: number;
    secondsPerQuestion: SecondsPerQuestion;
    questionCount: number;
    createdAt: number;
}

export interface ScoreboardRow {
    userId: number;
    userName: string;
    fullName: string;
    avatarUrl?: string;
    score: number;
    correct: number;
    totalMs: number;
    connected: boolean;
    rank: number;
}

export interface RevealPlayerResult {
    userId: number;
    answer: string | null;
    verdict: Verdict | null;
    points: number;
    ms: number | null;
}

export interface GameXpResult {
    userId: number;
    gained: number;
    level: number;
    xpIntoLevel: number;
    xpForNext: number;
    leveledUp: boolean;
}
