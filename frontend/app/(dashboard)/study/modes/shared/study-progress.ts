const STORAGE_PREFIX = "studyProgress:";
const STORAGE_VERSION = 1;
const MAX_STORED_ENTRIES = 40;

interface KeyedItem {
  terms: string[];
  translations: string[];
}

interface StoredProgress {
  v: number;
  queue: string[];
  pointer: number;
  updatedAt: number;
}

export interface RestoredProgress {
  queue: number[];
  pointer: number;
}

function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

export function buildItemKeys(items: KeyedItem[]): string[] {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const base = hash(
      `${item.terms.join("~")}=>${item.translations.join("~")}`,
    );
    const occurrence = seen.get(base) ?? 0;
    seen.set(base, occurrence + 1);
    return occurrence === 0 ? base : `${base}#${occurrence}`;
  });
}

function storageKey(groupId: number, modeId: string): string {
  return `${STORAGE_PREFIX}${groupId}:${modeId}`;
}

function readEntry(key: string): StoredProgress | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredProgress;
    if (
      !parsed ||
      parsed.v !== STORAGE_VERSION ||
      !Array.isArray(parsed.queue) ||
      typeof parsed.pointer !== "number" ||
      parsed.pointer < 0 ||
      parsed.queue.some((k) => typeof k !== "string")
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function prune() {
  const entries: { key: string; updatedAt: number }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
    entries.push({ key, updatedAt: readEntry(key)?.updatedAt ?? 0 });
  }
  if (entries.length <= MAX_STORED_ENTRIES) return;
  entries
    .sort((a, b) => a.updatedAt - b.updatedAt)
    .slice(0, entries.length - MAX_STORED_ENTRIES)
    .forEach((entry) => localStorage.removeItem(entry.key));
}

export function loadProgress(
  groupId: number,
  modeId: string,
  keys: string[],
): RestoredProgress | null {
  if (typeof window === "undefined") return null;
  const stored = readEntry(storageKey(groupId, modeId));
  if (!stored) return null;

  const indexByKey = new Map(keys.map((key, index) => [key, index]));
  const answered = stored.queue
    .slice(0, stored.pointer)
    .filter((key) => indexByKey.has(key));
  const remaining = stored.queue
    .slice(stored.pointer)
    .filter((key) => indexByKey.has(key));
  const knownKeys = new Set(stored.queue);
  const added = keys.filter((key) => !knownKeys.has(key));

  if (remaining.length + added.length === 0) return null;
  if (answered.length === 0 && remaining.length === 0) return null;

  const queue = [...answered, ...remaining, ...added].map(
    (key) => indexByKey.get(key) as number,
  );
  return { queue, pointer: answered.length };
}

export function saveProgress(
  groupId: number,
  modeId: string,
  keys: string[],
  queue: number[],
  pointer: number,
) {
  if (typeof window === "undefined") return;
  const mapped = queue
    .map((index) => keys[index])
    .filter((key): key is string => typeof key === "string");
  if (mapped.length !== queue.length) return;

  const payload: StoredProgress = {
    v: STORAGE_VERSION,
    queue: mapped,
    pointer: Math.max(0, Math.min(pointer, mapped.length)),
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(storageKey(groupId, modeId), JSON.stringify(payload));
    prune();
  } catch {
  }
}

export function clearProgress(groupId: number, modeId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(groupId, modeId));
  } catch {
  }
}
