export type GameRoomState = "lobby" | "countdown" | "question" | "reveal" | "finished";
export type GameVerdict = 0 | 1 | 2;
export type GameDirection = 1 | 2 | 3;
export type GameSeconds = 10 | 20 | 30;

export interface GameActionError {
  code: string;
  detail: string;
}

export interface GameTicket {
  ticket: string;
  expiresIn: number;
  serverNow: number;
  user: {
    userId: number;
    userName: string;
    fullName: string;
    avatarUrl?: string;
  };
}

export interface GameRoomSummary {
  code: string;
  shareId: string;
  groupName: string;
  languages: string[];
  hostUserName: string;
  hostFullName: string;
  playerCount: number;
  maxPlayers: number;
  secondsPerQuestion: GameSeconds;
  questionCount: number;
  createdAt: number;
}

export interface GamePlayerView {
  userId: number;
  userName: string;
  fullName: string;
  avatarUrl?: string;
  isHost: boolean;
  connected: boolean;
  score: number;
}

export interface GameRoomView {
  code: string;
  shareId: string;
  groupName: string;
  languages: string[];
  state: GameRoomState;
  secondsPerQuestion: GameSeconds;
  direction: GameDirection;
  questionCount: number;
  index: number;
  hostUserId: number;
  players: GamePlayerView[];
  maxPlayers: number;
  minPlayers: number;
}

export interface GameQuestionPayload {
  index: number;
  total: number;
  prompt: string;
  promptLang: string;
  answerLang: string;
  isSentence: boolean;
  startedAt: number;
  deadline: number;
  serverNow: number;
}

export interface GameScoreboardRow {
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

export interface GameRevealResult {
  userId: number;
  answer: string | null;
  verdict: GameVerdict | null;
  points: number;
  ms: number | null;
}

export interface GameRevealPayload {
  index: number;
  prompt: string;
  correctAnswers: string[];
  results: GameRevealResult[];
  scoreboard: GameScoreboardRow[];
  nextInMs: number;
  isLast: boolean;
}

export interface GameFinishedPayload {
  ranking: GameScoreboardRow[];
}
