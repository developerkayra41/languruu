import { TYPO_STRICT_MIN_LENGTH } from '../game.constants';
import { tokenize } from './normalize';

export function damerauLevenshtein(a: string, b: string, maxDistance: number): number {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > maxDistance) return -1;
    if (a.length === 0) return b.length <= maxDistance ? b.length : -1;
    if (b.length === 0) return a.length <= maxDistance ? a.length : -1;

    let previousPrevious: number[] = [];
    let previous: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
    let current: number[] = [];

    for (let i = 1; i <= a.length; i++) {
        current = new Array(b.length + 1);
        current[0] = i;
        let rowBest = current[0];

        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            let value = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);

            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                value = Math.min(value, previousPrevious[j - 2] + 1);
            }

            current[j] = value;
            if (value < rowBest) rowBest = value;
        }

        if (rowBest > maxDistance) return -1;

        previousPrevious = previous;
        previous = current;
    }

    const distance = previous[b.length];
    return distance <= maxDistance ? distance : -1;
}

function tokensMatch(a: string, b: string): boolean {
    if (a === b) return true;
    if (Math.min(a.length, b.length) < TYPO_STRICT_MIN_LENGTH) return false;
    return damerauLevenshtein(a, b, 1) >= 0;
}

export function fuzzyTokenF1(expected: string, candidate: string): number {
    const expectedTokens = tokenize(expected);
    const candidateTokens = tokenize(candidate);
    if (expectedTokens.length === 0 || candidateTokens.length === 0) return 0;

    const used = new Array(candidateTokens.length).fill(false);
    let matched = 0;

    for (const token of expectedTokens) {
        let hit = candidateTokens.findIndex((other, index) => !used[index] && other === token);
        if (hit === -1) {
            hit = candidateTokens.findIndex((other, index) => !used[index] && tokensMatch(token, other));
        }
        if (hit !== -1) {
            used[hit] = true;
            matched += 1;
        }
    }

    return (2 * matched) / (expectedTokens.length + candidateTokens.length);
}
