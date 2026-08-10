import { WordPool } from "@/app/types/word";

function normalize(word: string): string {
    return word.toLocaleLowerCase().trim();
}

function hasOverlap(a: WordPool, b: WordPool): boolean {
    const aTerms = new Set(a.term.map(normalize));
    const aTranslations = new Set(a.translation.map(normalize));
    const termOverlap = b.term.some((t) => aTerms.has(normalize(t)));
    const translationOverlap = b.translation.some((t) =>
        aTranslations.has(normalize(t))
    );

    return termOverlap || translationOverlap;
}

function mergeEntries(entries: WordPool[]): WordPool {
    const terms = new Set<string>();
    const translations = new Set<string>();

    for (const entry of entries) {
        entry.term.forEach((t) => terms.add(t.trim()));
        entry.translation.forEach((t) => translations.add(t.trim()));
    }

    return { term: [...terms], translation: [...translations] };
}

export function mergeNewEntryIntoPool(
    existingPool: WordPool[],
    newEntry: WordPool
): WordPool[] {
    const overlapping: WordPool[] = [];
    const untouched: WordPool[] = [];

    for (const entry of existingPool) {
        if (hasOverlap(entry, newEntry)) {
            overlapping.push(entry);
        } else {
            untouched.push(entry);
        }
    }

    if (overlapping.length === 0) {
        return [...existingPool, newEntry];
    }

    const merged = mergeEntries([...overlapping, newEntry]);
    return [...untouched, merged];
}

export function parseCommaList(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function formatCommaList(arr: string[]): string {
  return arr.join(", ");
}