import { WordExample, WordPool } from "@/app/types/word";

export const MAX_EXAMPLES = 3;
export const MAX_EXAMPLE_LENGTH = 200;

function exampleKey(example: WordExample): string {
    return `${normalize(example.text)}|${normalize(example.translation)}`;
}

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
    const examples = new Map<string, WordExample>();
    let note: string | undefined;

    for (const entry of entries) {
        entry.term.forEach((t) => terms.add(t.trim()));
        entry.translation.forEach((t) => translations.add(t.trim()));
        if (entry.note?.trim()) note = entry.note.trim();
        entry.examples?.forEach((example) => {
            if (examples.size >= MAX_EXAMPLES) return;
            const key = exampleKey(example);
            if (!examples.has(key)) examples.set(key, example);
        });
    }

    return {
        term: [...terms],
        translation: [...translations],
        ...(note ? { note } : {}),
        ...(examples.size > 0 ? { examples: [...examples.values()] } : {}),
    };
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
        return [newEntry, ...existingPool];
    }

    const merged = mergeEntries([...overlapping, newEntry]);
    return [merged, ...untouched];
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