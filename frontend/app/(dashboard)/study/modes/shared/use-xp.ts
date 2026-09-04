"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { awardXpAction } from "../../actions";

const STORAGE_KEY = "xpAwarded";
const LEVEL_KEY = "xpLevel";
const MAX_STORED_KEYS = 3000;
const BATCH_SIZE = 5;
const FLUSH_DELAY_MS = 8_000;
const LEVEL_UP_EMOJIS = ["⭐", "🎉", "🏅"];

interface AwardedDay {
  d: string;
  k: string[];
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function readAwarded(): AwardedDay {
  const fresh = { d: today(), k: [] as string[] };
  if (typeof window === "undefined") return fresh;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw) as AwardedDay;
    if (!parsed || parsed.d !== fresh.d || !Array.isArray(parsed.k)) return fresh;
    return parsed;
  } catch {
    return fresh;
  }
}

function claimKey(key: string): boolean {
  if (typeof window === "undefined") return false;
  const awarded = readAwarded();
  if (awarded.k.includes(key)) return false;
  awarded.k.push(key);
  if (awarded.k.length > MAX_STORED_KEYS) {
    awarded.k = awarded.k.slice(-MAX_STORED_KEYS);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(awarded));
  } catch {
    return false;
  }
  return true;
}

function readStoredLevel(): number | null {
  if (typeof window === "undefined") return null;
  const stored = Number(localStorage.getItem(LEVEL_KEY));
  return Number.isInteger(stored) && stored > 0 ? stored : null;
}

function storeLevel(level: number) {
  try {
    localStorage.setItem(LEVEL_KEY, String(level));
  } catch {
  }
}

export function useXpAwarder() {
  const t = useTranslations("study");
  const pendingRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelRef = useRef<number | null>(null);

  const celebrate = useCallback(
    (level: number) => {
      toast.success(t("levelUp", { level }));
      void import("js-confetti").then(({ default: JSConfetti }) => {
        new JSConfetti().addConfetti({ emojis: LEVEL_UP_EMOJIS });
      });
    },
    [t],
  );

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const words = pendingRef.current;
    pendingRef.current = 0;
    if (words <= 0) return;

    void awardXpAction(words).then((result) => {
      if (!result) return;
      const previous = levelRef.current ?? readStoredLevel();
      levelRef.current = result.level;
      storeLevel(result.level);
      if (previous !== null && result.level > previous) celebrate(result.level);
    });
  }, [celebrate]);

  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      flush();
    };
  }, [flush]);

  const awardWord = useCallback(
    (key: string | undefined) => {
      if (!key || !claimKey(key)) return;
      pendingRef.current += 1;
      if (pendingRef.current >= BATCH_SIZE) {
        flush();
        return;
      }
      if (!timerRef.current) {
        timerRef.current = setTimeout(flush, FLUSH_DELAY_MS);
      }
    },
    [flush],
  );

  return { awardWord };
}
