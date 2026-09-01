import { randomInt } from 'crypto';

export function shuffle<T>(input: T[]): T[] {
    const result = [...input];
    for (let i = result.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export function pickRandom<T>(input: T[]): T {
    return input[randomInt(input.length)];
}

export function cleanList(input: string[] | undefined): string[] {
    if (!Array.isArray(input)) return [];
    return input.map((value) => (typeof value === 'string' ? value.trim() : '')).filter((value) => value.length > 0);
}

export function tokenCount(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}
