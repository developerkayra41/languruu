"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { LANGUAGES } from "@/app/lib/languages";
import Flag from "./Flags";

interface LanguageSelectProps {
  label: string;
  value: string | null;
  onChange: (code: string) => void;
  excludeCode?: string | null;
}

export default function LanguageSelect({
  label,
  value,
  onChange,
  excludeCode,
}: LanguageSelectProps) {
  const t = useTranslations("languageSelect");
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected =
    LANGUAGES.find((l) => l.code === value) ??
    (value
      ? { code: value, label: value.toUpperCase(), flagCode: value }
      : null);
  const filtered = LANGUAGES.filter(
    (l) =>
      l.code !== excludeCode &&
      (l.label.toLowerCase().includes(query.toLowerCase()) ||
        l.code.includes(query.toLowerCase())),
  );

  const trimmedQuery = query.trim().toLowerCase();
  const exactMatchExists = LANGUAGES.some((l) => l.code === trimmedQuery);
  const canAddCustom = trimmedQuery.length > 0 && !exactMatchExists;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    onChange(code);
    setQuery("");
    setIsOpen(false);
  };

  const handleAddCustom = () => {
    if (!trimmedQuery) return;
    onChange(trimmedQuery);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-gray-700 text-sm font-medium mb-2">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <Flag code={selected.flagCode} />
            <span className="font-medium text-gray-700">
              {selected.code.toUpperCase()}
            </span>
            <span className="text-gray-400 text-sm">{selected.label}</span>
          </span>
        ) : (
          <span className="text-gray-400">{t("placeholder")}</span>
        )}
        <i className="fas fa-chevron-down text-xs text-gray-400"></i>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            placeholder={t("searchPlaceholder")}
            className="w-full px-3 py-2 border-b border-gray-100 focus:outline-none text-sm"
          />

          {filtered.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-sm"
            >
              <Flag code={lang.flagCode} />
              <span className="font-medium w-8">{lang.code.toUpperCase()}</span>
              <span className="text-gray-500">{lang.label}</span>
            </button>
          ))}

          {canAddCustom && (
            <button
              type="button"
              onClick={handleAddCustom}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-purple-50 text-left text-sm text-purple-600 border-t border-gray-100"
            >
              <i className="fas fa-plus text-xs"></i>
              <span>{t("add", { query: query.trim() })}</span>
            </button>
          )}

          {filtered.length === 0 && !canAddCustom && (
            <div className="px-3 py-2 text-sm text-gray-400">{t("noResult")}</div>
          )}
        </div>
      )}
    </div>
  );
}
