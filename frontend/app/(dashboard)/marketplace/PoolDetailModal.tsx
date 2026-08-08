"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PoolDetail } from "@/app/types/marketplace";
import { getPoolDetail } from "./actions";
import { useSwipe } from "@/app/lib/use-swipe";

const PAGE_SIZE = 10;

interface PoolDetailModalProps {
  shareId: string;
  onClose: () => void;
}

export default function PoolDetailModal({ shareId, onClose }: PoolDetailModalProps) {
  const t = useTranslations("poolDetail");
  const [detail, setDetail] = useState<PoolDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError("");
      const result = await getPoolDetail(shareId);
      if (!isMounted) return;

      if (!result.success) {
        setError(result.error);
      } else {
        setDetail(result.data);
      }
      setIsLoading(false);
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [shareId]);

  const wordPool = detail?.wordPool ?? [];
  const totalPages = Math.max(1, Math.ceil(wordPool.length / PAGE_SIZE));
  const pageStart = currentPage * PAGE_SIZE;
  const visibleEntries = wordPool.slice(pageStart, pageStart + PAGE_SIZE);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 0), totalPages - 1));
  };

  // Mobilde parmakla sağa/sola kaydırınca sayfa değiştir
  const swipe = useSwipe(
    () => goToPage(currentPage + 1),
    () => goToPage(currentPage - 1),
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            {isLoading ? (
              <div className="h-6 w-40 bg-gray-100 rounded animate-pulse" />
            ) : (
              <>
                <h3 className="text-xl font-semibold text-gray-800">{detail?.name}</h3>
                {detail && (
                  <p className="text-sm text-gray-500 mt-1">
                    {detail.author_name}{" "}
                    <span className="text-gray-400">@{detail.author_username}</span>
                    <span className="text-gray-300 mx-2">·</span>
                    {t("wordCount", { count: wordPool.length })}
                  </p>
                )}
              </>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Açıklama + diller (varsa) */}
        {!isLoading && detail && (detail.description || detail.languages.length > 0) && (
          <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
            {detail.description && (
              <p className="text-sm text-gray-600 mb-2">{detail.description}</p>
            )}
            {detail.languages.length > 0 && (
              <div className="flex gap-1">
                {detail.languages.map((lang) => (
                  <span
                    key={lang}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                  >
                    {lang.toUpperCase()}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* İçerik */}
        <div
          className="overflow-y-auto flex-1 px-4 py-4"
          onTouchStart={swipe.onTouchStart}
          onTouchEnd={swipe.onTouchEnd}
        >
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500 text-sm">{error}</div>
          ) : wordPool.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              {t("empty")}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white py-2.5">
                <div className="grid grid-cols-2 text-center px-4">
                  <div className="font-semibold text-sm tracking-wide">
                    {t("word")}
                  </div>
                  <div className="font-semibold text-sm tracking-wide">
                    {t("meaning")}
                  </div>
                </div>
              </div>
              <div>
                {visibleEntries.map((pool, i) => (
                  <div
                    key={pageStart + i}
                    className={`grid grid-cols-2 items-center px-4 py-3 ${
                      i % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <div className="text-center text-sm font-medium text-gray-700">
                      {pool.term.join(" / ")}
                    </div>
                    <div className="text-center text-sm text-gray-600">
                      {pool.translation.join(" / ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 flex-shrink-0">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="text-gray-500 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1 text-sm"
            >
              <i className="fas fa-chevron-left mr-1"></i> {t("prev")}
            </button>

            {/* Masaüstü: sayfa numaraları */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i)}
                  className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                    currentPage === i
                      ? "bg-purple-600 text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            {/* Mobil: kompakt gösterge */}
            <span className="sm:hidden text-sm font-medium text-gray-500 tabular-nums">
              {currentPage + 1} / {totalPages}
            </span>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className="text-gray-500 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1 text-sm"
            >
              {t("next")} <i className="fas fa-chevron-right ml-1"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}