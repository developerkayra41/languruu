"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { WordColumn, WordPool } from "@/app/types/word";
import { useUnsavedGuard } from "@/app/lib/use-unsaved-guard";
import { saveSongLines } from "./actions";

const MAX_LINES = 300;
const MAX_LINE_LENGTH = 200;
const MAX_NOTE_LENGTH = 200;

interface SongRow {
  line: string;
  meaning: string;
  note: string;
  showNote: boolean;
}

interface SongAddClientProps {
  group: WordColumn;
}

function toRows(pool: WordPool[]): SongRow[] {
  if (pool.length === 0) return [{ line: "", meaning: "", note: "", showNote: false }];
  return pool.map((entry) => ({
    line: entry.term[0] ?? "",
    meaning: entry.translation[0] ?? "",
    note: entry.note ?? "",
    showNote: Boolean(entry.note),
  }));
}

function fingerprint(rows: SongRow[]): string {
  return JSON.stringify(
    rows.map((row) => [row.line.trim(), row.meaning.trim(), row.note.trim()]),
  );
}

export default function SongAddClient({ group }: SongAddClientProps) {
  const t = useTranslations("add");
  const [rows, setRows] = useState<SongRow[]>(() => toRows(group.wordPool));
  const [savedPrint, setSavedPrint] = useState(() => fingerprint(toRows(group.wordPool)));
  const [isPending, startTransition] = useTransition();

  const lineRefs = useRef<(HTMLInputElement | null)[]>([]);
  const meaningRefs = useRef<(HTMLInputElement | null)[]>([]);
  const focusIndexRef = useRef<number | null>(null);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const leaveResolver = useRef<((value: boolean) => void) | null>(null);

  const isDirty = fingerprint(rows) !== savedPrint;

  useEffect(() => {
    const index = focusIndexRef.current;
    if (index === null) return;
    focusIndexRef.current = null;
    lineRefs.current[index]?.focus();
  }, [rows.length]);

  const updateRow = (index: number, patch: Partial<SongRow>) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const addRow = (afterIndex?: number) => {
    if (rows.length >= MAX_LINES) {
      toast.error(t("song.errMaxLines", { max: MAX_LINES }));
      return;
    }
    const position = afterIndex === undefined ? rows.length : afterIndex + 1;
    setRows((prev) => {
      const next = [...prev];
      next.splice(position, 0, { line: "", meaning: "", note: "", showNote: false });
      return next;
    });
    focusIndexRef.current = position;
  };

  const removeRow = (index: number) => {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0
        ? next
        : [{ line: "", meaning: "", note: "", showNote: false }];
    });
  };

  const buildPool = (): WordPool[] | null => {
    const pool: WordPool[] = [];

    for (let i = 0; i < rows.length; i++) {
      const line = rows[i].line.trim();
      const meaning = rows[i].meaning.trim();
      const note = rows[i].note.trim();

      if (!line && !meaning) continue;
      if (!line || !meaning) {
        toast.error(t("song.errPair", { line: i + 1 }));
        return null;
      }

      pool.push({
        term: [line],
        translation: [meaning],
        ...(note ? { note } : {}),
      });
    }

    if (pool.length === 0) {
      toast.error(t("song.errEmpty"));
      return null;
    }

    return pool;
  };

  const save = useCallback(
    (pool: WordPool[]) =>
      new Promise<boolean>((resolve) => {
        startTransition(async () => {
          const result = await saveSongLines(group, pool);
          if (!result.success) {
            toast.error(result.error);
            resolve(false);
            return;
          }
          const savedRows = toRows(result.data.wordPool);
          setRows(savedRows);
          setSavedPrint(fingerprint(savedRows));
          toast.success(t("song.saved"));
          resolve(true);
        });
      }),
    [group, t],
  );

  const handleSave = () => {
    const pool = buildPool();
    if (!pool) return;
    void save(pool);
  };

  const askToLeave = useCallback(() => {
    setLeaveOpen(true);
    return new Promise<boolean>((resolve) => {
      leaveResolver.current = resolve;
    });
  }, []);

  const settleLeave = (allowed: boolean) => {
    setLeaveOpen(false);
    leaveResolver.current?.(allowed);
    leaveResolver.current = null;
  };

  const handleSaveAndLeave = () => {
    const pool = buildPool();
    if (!pool) {
      settleLeave(false);
      return;
    }
    void save(pool).then((ok) => settleLeave(ok));
  };

  useUnsavedGuard(isDirty, askToLeave);

  useEffect(() => {
    if (!leaveOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      settleLeave(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [leaveOpen]);

  const filledCount = rows.filter(
    (row) => row.line.trim() && row.meaning.trim(),
  ).length;

  const sourceLang = group.languages?.[0]?.toUpperCase();
  const targetLang = group.languages?.[1]?.toUpperCase();

  const cellClass =
    "w-full px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 placeholder:text-gray-400";

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">
        <i className="fas fa-music text-purple-500 mr-2"></i>
        {t("song.title")}
      </h2>
      <p className="text-sm text-gray-500 mb-1">
        {t.rich("song.editingIn", {
          name: group.name,
          b: (c) => <span className="font-medium">{c}</span>,
        })}
        {" · "}
        {t("song.lineCount", { count: filledCount })}
      </p>
      <p className="text-xs text-gray-400 mb-4">{t("song.orderHint")}</p>

      <div className="border border-gray-300 rounded-md overflow-hidden">
        <div className="hidden sm:flex bg-gray-50 border-b border-gray-300 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <span className="w-10 shrink-0 px-2 py-2 text-center">#</span>
          <span className="flex-1 px-3 py-2 border-l border-gray-200">
            {t("song.colLine")}
            {sourceLang && <span className="ml-1 normal-case text-gray-400">({sourceLang})</span>}
          </span>
          <span className="flex-1 px-3 py-2 border-l border-gray-200">
            {t("song.colMeaning")}
            {targetLang && <span className="ml-1 normal-case text-gray-400">({targetLang})</span>}
          </span>
          <span className="w-20 shrink-0 px-2 py-2 border-l border-gray-200"></span>
        </div>

        {rows.map((row, index) => (
          <div
            key={index}
            className={`${index > 0 ? "border-t border-gray-200" : ""}`}
          >
            <div className="flex flex-col sm:flex-row">
              <span className="hidden sm:flex w-10 shrink-0 items-center justify-center text-xs text-gray-400">
                {index + 1}
              </span>
              <div className="flex-1 sm:border-l border-gray-200 flex items-center">
                <span className="sm:hidden pl-3 text-xs text-gray-400">
                  {index + 1}
                </span>
                <input
                  type="text"
                  ref={(el) => {
                    lineRefs.current[index] = el;
                  }}
                  value={row.line}
                  maxLength={MAX_LINE_LENGTH}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  placeholder={t("song.linePlaceholder")}
                  onChange={(e) => updateRow(index, { line: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                    e.preventDefault();
                    meaningRefs.current[index]?.focus();
                  }}
                  className={cellClass}
                />
              </div>
              <div className="flex-1 border-t sm:border-t-0 sm:border-l border-gray-200">
                <input
                  type="text"
                  ref={(el) => {
                    meaningRefs.current[index] = el;
                  }}
                  value={row.meaning}
                  maxLength={MAX_LINE_LENGTH}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  placeholder={t("song.meaningPlaceholder")}
                  onChange={(e) => updateRow(index, { meaning: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                    e.preventDefault();
                    addRow(index);
                  }}
                  className={cellClass}
                />
              </div>
              <div className="flex w-full sm:w-20 shrink-0 items-center justify-end sm:justify-center gap-1 border-t sm:border-t-0 sm:border-l border-gray-200 px-2 py-1">
                <button
                  type="button"
                  onClick={() =>
                    updateRow(index, {
                      showNote: !row.showNote,
                      ...(row.showNote ? { note: "" } : {}),
                    })
                  }
                  title={row.showNote ? t("song.removeNote") : t("song.addNote")}
                  aria-label={row.showNote ? t("song.removeNote") : t("song.addNote")}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer ${
                    row.showNote
                      ? "bg-purple-100 text-purple-600"
                      : "text-gray-400 hover:text-purple-600 hover:bg-purple-50"
                  }`}
                >
                  <i className="fas fa-note-sticky"></i>
                </button>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  title={t("song.removeLine")}
                  aria-label={t("song.removeLine")}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>

            {row.showNote && (
              <div className="border-t border-gray-200 bg-gray-50 px-3 py-2">
                <input
                  type="text"
                  value={row.note}
                  maxLength={MAX_NOTE_LENGTH}
                  autoFocus
                  placeholder={t("song.notePlaceholder")}
                  onChange={(e) => updateRow(index, { note: e.target.value })}
                  className="w-full bg-transparent text-sm text-gray-600 focus:outline-none placeholder:text-gray-400"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => addRow()}
        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 cursor-pointer"
      >
        <i className="fas fa-arrow-turn-down text-xs"></i>
        {t("song.addLine")}
      </button>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !isDirty}
          className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer disabled:cursor-not-allowed"
        >
          {isPending ? t("song.saving") : t("song.save")}
        </button>
        {isDirty && (
          <span className="text-xs text-amber-600">
            <i className="fas fa-circle-exclamation mr-1"></i>
            {t("song.unsaved")}
          </span>
        )}
      </div>

      {leaveOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4"
            onClick={() => settleLeave(false)}
          >
            <div
              className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t("song.leaveTitle")}
              </h3>
              <p className="text-sm text-gray-600 mb-5">
                {t("song.leaveMessage")}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSaveAndLeave}
                  disabled={isPending}
                  className="w-full px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-md transition-colors cursor-pointer"
                >
                  {isPending ? t("song.saving") : t("song.saveAndLeave")}
                </button>
                <button
                  type="button"
                  onClick={() => settleLeave(true)}
                  className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                >
                  {t("song.leaveWithoutSaving")}
                </button>
                <button
                  type="button"
                  onClick={() => settleLeave(false)}
                  className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-md transition-colors cursor-pointer"
                >
                  {t("song.stay")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
