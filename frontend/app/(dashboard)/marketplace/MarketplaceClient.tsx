"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { MarketplaceEntry } from "@/app/types/marketplace";
import { copyMarketplaceEntry, unshareMarketplaceEntry } from "./actions";
import PoolDetailModal from "./PoolDetailModal";
import Link from "next/link";
import { toast } from "sonner";
import { LanguagePair } from "@/app/components/ui/Flags";
import { LANGUAGES } from "@/app/lib/languages";
import ReportButton from "@/app/components/report/ReportButton";
import { useConfirm } from "@/app/components/ui/useConfirm";
import GameStartButton from "@/app/components/game/GameStartButton";

interface MarketplaceClientProps {
  items: MarketplaceEntry[];
  currentPage: number;
  totalPages: number;
  initialSearch: string;
  initialOnlyMine: boolean;
  initialSourceLanguage: string;
  initialTargetLanguage: string;
}

export default function MarketplaceClient({
  items,
  currentPage,
  totalPages,
  initialSearch,
  initialOnlyMine,
  initialSourceLanguage,
  initialTargetLanguage,
}: MarketplaceClientProps) {
  const t = useTranslations("marketplace");
  const tLang = useTranslations("languages");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const langDisplay = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: "language" });
    } catch {
      return null;
    }
  }, [locale]);
  const langLabel = (l: { code: string }) => {
    const name = langDisplay?.of(l.code);
    if (name && name !== l.code) {
      return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
    }
    return tLang.has(l.code) ? tLang(l.code) : l.code.toUpperCase();
  };

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);

  const [detailShareId, setDetailShareId] = useState<string | null>(null);

  const [unsharingId, setUnsharingId] = useState<string | null>(null);
  const { confirm, confirmDialog } = useConfirm();

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const updateUrl = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    if (!("page" in updates)) {
      next.delete("page");
    }
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      updateUrl({ search: value });
    }, 400);
  };

  const goToPage = (page: number) => {
    updateUrl({ page: String(page) });
  };

  const handleCopy = (entry: MarketplaceEntry) => {
    setCopyingId(entry.share_id);
    startTransition(async () => {
      const result = await copyMarketplaceEntry(entry.share_id);
      setCopyingId(null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t("added"));
      setCopySuccessId(entry.share_id);
      setTimeout(() => setCopySuccessId(null), 2000);
    });
  };

  const toggleOnlyMine = () => {
    updateUrl({ onlyMine: initialOnlyMine ? null : "true" });
  };

  const handleUnshare = async (entry: MarketplaceEntry) => {
    if (
      !(await confirm({
        message: t("removeConfirm", { name: entry.name }),
        danger: true,
      }))
    ) {
      return;
    }
    setUnsharingId(entry.share_id);
    startTransition(async () => {
      const result = await unshareMarketplaceEntry(entry.share_id);
      setUnsharingId(null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div>
      {confirmDialog}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
        <h2 className="text-xl font-semibold text-gray-800">{t("title")}</h2>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button
            onClick={toggleOnlyMine}
            className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition ${
              initialOnlyMine
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <i className="fas fa-user mr-1"></i> {t("myGroups")}
          </button>
          <select
            value={initialSourceLanguage}
            onChange={(e) =>
              updateUrl({ sourceLanguage: e.target.value || null })
            }
            className="flex-1 min-w-[120px] md:flex-none px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">{t("sourceAll")}</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {langLabel(l)}
              </option>
            ))}
          </select>
          <select
            value={initialTargetLanguage}
            onChange={(e) =>
              updateUrl({ targetLanguage: e.target.value || null })
            }
            className="flex-1 min-w-[120px] md:flex-none px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">{t("targetAll")}</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {langLabel(l)}
              </option>
            ))}
          </select>
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <i className="fas fa-search"></i>
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-500">{t("empty")}</div>
      ) : (
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity ${
            isPending ? "opacity-50" : "opacity-100"
          }`}
        >
          {items.map((entry) => (
            <div
              key={entry.share_id}
              className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-4">
                <div className="flex justify-between items-start">
                  <h3
                    className="font-semibold text-lg cursor-pointer hover:underline"
                    onClick={() => setDetailShareId(entry.share_id)}
                  >
                    {entry.name}
                  </h3>
                  <div className="flex items-center text-sm">
                    <i className="fas fa-download mr-1"></i>
                    <span>{entry.downloads}</span>
                  </div>
                </div>
                <p className="text-sm text-blue-100">
                  {t("wordCount", { count: entry.word_count })}
                </p>
                <GameStartButton
                  shareId={entry.share_id}
                  languages={entry.languages}
                  groupName={entry.name}
                />
              </div>
              <div className="p-4">
                {entry.languages && entry.languages.length > 0 && (
                  <div className="mb-3">
                    <LanguagePair
                      languages={entry.languages}
                      className=" text-black"
                    />
                  </div>
                )}

                <div className="flex items-center text-sm mb-3">
                  <i className="fas fa-user mr-2 text-gray-400"></i>
                  <span className="font-medium text-gray-700">
                    {entry.author_name}
                  </span>
                  <Link
                    href={`/users/${entry.author_username}`}
                    className="ml-1 text-xs text-gray-400 hover:text-purple-600 hover:underline"
                  >
                    @{entry.author_username}
                  </Link>
                  {!entry.is_own && (
                    <ReportButton
                      targetType="word_group"
                      targetRef={entry.share_id}
                      className="text-xs text-gray-400 hover:text-red-500 ml-auto"
                    />
                  )}
                </div>

                {entry.is_own ? (
                  <button
                    onClick={() => handleUnshare(entry)}
                    disabled={unsharingId === entry.share_id}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 disabled:opacity-50"
                  >
                    {unsharingId === entry.share_id ? (
                      t("removing")
                    ) : (
                      <>
                        <i className="fas fa-trash mr-1"></i> {t("remove")}
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleCopy(entry)}
                    disabled={copyingId === entry.share_id}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50"
                  >
                    {copyingId === entry.share_id ? (
                      t("adding")
                    ) : copySuccessId === entry.share_id ? (
                      <>
                        <i className="fas fa-check mr-1"></i> {t("added")}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-book-reader mr-1"></i> {t("use")}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-8">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-gray-500 hover:text-purple-600 disabled:opacity-30"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          {/* Masaüstü: sayfa numaraları */}
          <div className="hidden sm:flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                className={`w-8 h-8 rounded-full text-sm font-medium ${
                  currentPage === i + 1
                    ? "bg-purple-600 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          {/* Mobil: kompakt gösterge */}
          <span className="sm:hidden px-2 text-sm font-medium text-gray-500 tabular-nums">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-gray-500 hover:text-purple-600 disabled:opacity-30"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {detailShareId && (
        <PoolDetailModal
          shareId={detailShareId}
          onClose={() => setDetailShareId(null)}
        />
      )}
    </div>
  );
}
