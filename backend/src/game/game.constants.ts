export const GAME_NAMESPACE = '/game';
export const GAME_TICKET_AUDIENCE = 'game';
export const TICKET_TTL_SECONDS = 60;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 10;
export const MIN_QUESTIONS = 3;
export const MAX_QUESTIONS = 50;

export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const SWEEP_INTERVAL_MS = 15_000;
export const AUTH_RECHECK_INTERVAL_MS = 5 * 60_000;

export const LOBBY_DISCONNECT_GRACE_MS = 30_000;
export const MATCH_DISCONNECT_GRACE_MS = 90_000;
export const HOST_TRANSFER_GRACE_MS = 60_000;
export const LOBBY_TTL_MS = 15 * 60_000;
export const FINISHED_ROOM_TTL_MS = 5 * 60_000;

export const SOCKET_EVENT_WINDOW_MS = 1_000;
export const SOCKET_EVENT_WARN_LIMIT = 20;
export const SOCKET_EVENT_KICK_LIMIT = 50;

export const SENTENCE_TOKEN_THRESHOLD = 3;

export const COUNTDOWN_MS = 3_000;
export const REVEAL_MS = 3_500;
export const ALL_ANSWERED_DELAY_MS = 400;
export const DEADLINE_SLACK_MS = 500;
export const ANSWER_GRACE_MS = 750;
export const MAX_ANSWER_LENGTH = 300;

export const BASE_POINTS = 100;
export const SPEED_POINTS = 100;
export const CLOSE_MULTIPLIER = 0.6;

export const TYPO_STRICT_MIN_LENGTH = 5;
export const TYPO_LOOSE_MIN_LENGTH = 8;
export const SENTENCE_CORRECT_F1 = 0.9;
export const SENTENCE_CLOSE_F1 = 0.6;
