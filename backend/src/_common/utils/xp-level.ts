export const XP_PER_WORD = 1;
export const GAME_SCORE_PER_XP = 100;
export const DAILY_XP_CAP = 300;
export const LEVEL_STEP = 100;
export const MAX_WORDS_PER_AWARD = 50;

export interface LevelInfo {
    xp: number;
    level: number;
    xp_into_level: number;
    xp_for_next: number;
}

export const totalXpForLevel = (level: number): number =>
    level <= 1 ? 0 : (LEVEL_STEP / 2) * level * (level - 1);

export const xpForNextLevel = (level: number): number => LEVEL_STEP * level;

export const levelFromXp = (xp: number): number => {
    const safeXp = Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;
    let level = Math.floor((LEVEL_STEP / 2 + Math.sqrt((LEVEL_STEP / 2) ** 2 + 2 * LEVEL_STEP * safeXp)) / LEVEL_STEP);
    if (level < 1) level = 1;
    while (totalXpForLevel(level + 1) <= safeXp) level += 1;
    while (level > 1 && totalXpForLevel(level) > safeXp) level -= 1;
    return level;
};

export const levelInfo = (xp: number | null | undefined): LevelInfo => {
    const safeXp = Number.isFinite(xp) && (xp ?? 0) > 0 ? Math.floor(xp as number) : 0;
    const level = levelFromXp(safeXp);
    return {
        xp: safeXp,
        level,
        xp_into_level: safeXp - totalXpForLevel(level),
        xp_for_next: xpForNextLevel(level),
    };
};

export const xpFromGameScore = (score: number): number =>
    Number.isFinite(score) && score > 0 ? Math.round(score / GAME_SCORE_PER_XP) : 0;
