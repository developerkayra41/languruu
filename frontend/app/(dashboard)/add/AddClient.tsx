"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { WordColumn, WordPool } from "@/app/types/word";
import { addWordEntry } from "./actions";
import { parseCommaList } from "@/app/lib/word-pool-utils";
import { toast } from "sonner";

interface AddClientProps {
  group: WordColumn;
}

export default function AddClient({ group }: AddClientProps) {
  const t = useTranslations("add");
  const [wordPool, setWordPool] = useState<WordPool[]>(group.wordPool);
  const [termInput, setTermInput] = useState("");
  const [translationInput, setTranslationInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const termRef = useRef<HTMLInputElement>(null);
  const translationRef = useRef<HTMLInputElement>(null);
  const handleAddWord = () => {
    const terms = parseCommaList(termInput);
    const translations = parseCommaList(translationInput);

    if (terms.length === 0 || translations.length === 0) {
      toast.error(t("errEmpty"));
      return;
    }

    const normalizeSet = (arr: string[]) =>
      new Set(arr.map((w) => w.trim().toLocaleLowerCase()).filter(Boolean));
    const overlaps = (a: Set<string>, b: Set<string>) =>
      [...a].some((x) => b.has(x));

    const newTerms = normalizeSet(terms);
    const newTrans = normalizeSet(translations);
    const isDuplicate = wordPool.some((p) => {
      const pTerms = normalizeSet(p.term);
      const pTrans = normalizeSet(p.translation);
      return overlaps(newTerms, pTerms) && overlaps(newTrans, pTrans);
    });
    if (isDuplicate) {
      toast.error(t("errDuplicate"));
      return;
    }

    const newEntry: WordPool = { term: terms, translation: translations };

    const previousPool = wordPool;
    setWordPool((prev) => [...prev, newEntry]);
    setTermInput("");
    setTranslationInput("");
    termRef.current?.focus();

    startTransition(async () => {
      const result = await addWordEntry(group, newEntry);

      if (!result.success) {
        setWordPool(previousPool);
        toast.error(result.error);
      } else {
        setWordPool(result.data.wordPool);
      }
    });
  };

  const isLong = termInput.length > 40 || translationInput.length > 40;

  return (
    <div
      className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
      onClick={(e) => {
        const el = e.target as HTMLElement;
        if (el.closest("input, button, a, textarea, [role=button]")) return;
        (document.activeElement as HTMLElement | null)?.blur();
      }}
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-1">{t("title")}</h2>
      <p className="text-sm text-gray-500 mb-4">
        {t.rich("addingTo", {
          name: group.name,
          b: (c) => <span className="font-medium">{c}</span>,
        })}
        {" · "}
        {t("wordCount", { count: wordPool.length })}
      </p>

      <div
        className={`grid grid-cols-1 gap-4 mb-4 ${
          isLong ? "" : "md:grid-cols-2"
        }`}
      >
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            {t("foreignWords")}
          </label>
          <input
            type="text"
            ref={termRef}
            value={termInput}
            maxLength={100}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            onChange={(e) => setTermInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                translationRef.current?.focus();
              }
            }}
            placeholder={t("foreignPlaceholder")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-gray-400 mt-1">{t("commaHint")}</p>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            {t("translations")}
          </label>
          <input
            type="text"
            ref={translationRef}
            value={translationInput}
            maxLength={100}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            onChange={(e) => setTranslationInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddWord();
              }
            }}
            placeholder={t("translationPlaceholder")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-gray-400 mt-1">{t("commaHint")}</p>
        </div>
      </div>

      <button
        onClick={handleAddWord}
        disabled={isPending}
        className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]"
      >
        {isPending ? t("submitting") : t("submit")}
      </button>

      {wordPool.length > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t("recent")}
          </h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {[...wordPool]
              .reverse()
              .slice(0, 5)
              .map((pool, i) => (
                <div key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="font-medium">{pool.term.join(" / ")}</span>
                  <span className="text-gray-400">→</span>
                  <span>{pool.translation.join(" / ")}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
