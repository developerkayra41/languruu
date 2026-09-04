"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { WordColumn, WordPool } from "@/app/types/word";
import { updateWordPool } from "./actions";
import { parseCommaList, formatCommaList, MAX_EXAMPLE_LENGTH } from "@/app/lib/word-pool-utils";
import { useSwipe } from "@/app/lib/use-swipe";
import { toast } from "sonner";
import NoteTooltip from "@/app/components/ui/NoteTooltip";

const PAGE_SIZE = 10;

type EditField =
  | "term"
  | "translation"
  | "note"
  | "example"
  | "exampleTranslation";

type EditFieldRefs = {
  current: Partial<Record<EditField, HTMLInputElement | null>>;
};

const NEXT_EDIT_FIELD: Partial<Record<EditField, EditField>> = {
  term: "translation",
  note: "example",
  example: "exampleTranslation",
};

interface WordsClientProps {
  group: WordColumn;
}

export default function WordsClient({ group }: WordsClientProps) {
  const t = useTranslations("words");
  const [wordPool, setWordPool] = useState<WordPool[]>(group.wordPool);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTermInput, setEditTermInput] = useState("");
  const [editTranslationInput, setEditTranslationInput] = useState("");
  const [editNoteInput, setEditNoteInput] = useState("");
  const [editExampleInput, setEditExampleInput] = useState("");
  const [editExampleTranslationInput, setEditExampleTranslationInput] = useState("");

  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);

  const desktopFieldRefs: EditFieldRefs = useRef({});
  const mobileFieldRefs: EditFieldRefs = useRef({});

  const indexedPool = wordPool.map((entry, realIndex) => ({
    entry,
    realIndex,
  }));

  const q = search.trim().toLocaleLowerCase();
  const filteredPool = q
    ? indexedPool.filter(({ entry }) =>
        [...entry.term, ...entry.translation].some((w) =>
          w.toLocaleLowerCase().includes(q),
        ),
      )
    : indexedPool;

  const totalPages = Math.max(1, Math.ceil(filteredPool.length / PAGE_SIZE));
  const pageStart = currentPage * PAGE_SIZE;
  const visibleEntries = filteredPool.slice(pageStart, pageStart + PAGE_SIZE);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 0), totalPages - 1));
  };

  const swipe = useSwipe(
    () => goToPage(currentPage + 1),
    () => goToPage(currentPage - 1),
  );

  const handleStartEdit = (realIndex: number) => {
    setEditingIndex(realIndex);
    setEditTermInput(formatCommaList(wordPool[realIndex].term));
    setEditTranslationInput(formatCommaList(wordPool[realIndex].translation));
    setEditNoteInput(wordPool[realIndex].note ?? "");
    setEditExampleInput(wordPool[realIndex].examples?.[0]?.text ?? "");
    setEditExampleTranslationInput(
      wordPool[realIndex].examples?.[0]?.translation ?? "",
    );
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditTermInput("");
    setEditTranslationInput("");
    setEditNoteInput("");
    setEditExampleInput("");
    setEditExampleTranslationInput("");
  };

  const handleSaveEdit = (realIndex: number) => {
    const terms = parseCommaList(editTermInput);
    const translations = parseCommaList(editTranslationInput);

    if (terms.length === 0 || translations.length === 0) {
      toast.error(t("errEmpty"));
      return;
    }

    const trimmedNote = editNoteInput.trim();
    const exampleText = editExampleInput.trim();
    const exampleTranslation = editExampleTranslationInput.trim();

    if (Boolean(exampleText) !== Boolean(exampleTranslation)) {
      toast.error(t("errExampleIncomplete"));
      return;
    }

    const previousPool = wordPool;
    const nextPool = wordPool.map((entry, i) => {
      if (i !== realIndex) return entry;
      const updated: WordPool = {
        ...entry,
        term: terms,
        translation: translations,
      };
      if (trimmedNote) updated.note = trimmedNote;
      else delete updated.note;
      if (exampleText && exampleTranslation) {
        updated.examples = [
          { text: exampleText, translation: exampleTranslation },
          ...(entry.examples?.slice(1) ?? []),
        ];
      } else if (entry.examples?.length) {
        const rest = entry.examples.slice(1);
        if (rest.length) updated.examples = rest;
        else delete updated.examples;
      }
      return updated;
    });

    setWordPool(nextPool);
    setEditingIndex(null);
    setEditNoteInput("");
    setEditExampleInput("");
    setEditExampleTranslationInput("");

    startTransition(async () => {
      const result = await updateWordPool(group, nextPool);
      if (!result.success) {
        setWordPool(previousPool);
        toast.error(result.error);
      } else {
        setWordPool(result.data.wordPool);
      }
    });
  };

  useEffect(() => {
    if (editingIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      handleCancelEdit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingIndex]);

  const handleEditKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: EditField,
    realIndex: number,
    refs: EditFieldRefs,
  ) => {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    e.preventDefault();

    const nextField = NEXT_EDIT_FIELD[field];
    if (nextField) {
      refs.current[nextField]?.focus();
      return;
    }

    if (!isPending) handleSaveEdit(realIndex);
  };

  const handleDelete = (realIndex: number) => {
    const previousPool = wordPool;
    const nextPool = wordPool.filter((_, i) => i !== realIndex);

    setWordPool(nextPool);

    const newTotalPages = Math.max(1, Math.ceil(nextPool.length / PAGE_SIZE));
    if (currentPage > newTotalPages - 1) {
      setCurrentPage(newTotalPages - 1);
    }

    startTransition(async () => {
      const result = await updateWordPool(group, nextPool);
      if (!result.success) {
        setWordPool(previousPool);
        toast.error(result.error);
      } else {
        setWordPool(result.data.wordPool);
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
     <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{group.name}</h2>
          <p className="text-sm text-gray-500">
            {t("wordCount", { count: wordPool.length })}
          </p>
        </div>
        <button
          onClick={() => {
            setSearchOpen((o) => !o);
            setSearch("");
            setCurrentPage(0);
          }}
          title={t("searchToggle")}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            searchOpen
              ? "bg-purple-100 text-purple-600"
              : "text-gray-400 hover:bg-gray-100"
          }`}
        >
          <i className="fas fa-search"></i>
        </button>
      </div>

      {searchOpen && (
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(0);
              }}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      )}

     {wordPool.length === 0 ? (
        <div className="p-8 text-center text-gray-500">{t("empty")}</div>
      ) : filteredPool.length === 0 ? (
        <div className="p-8 text-center text-gray-500">{t("searchEmpty")}</div>
      ) : (
        <>
          <div onTouchStart={swipe.onTouchStart} onTouchEnd={swipe.onTouchEnd}>
            {/* Masaüstü: tablo görünümü */}
            <div className="hidden md:block">
              <div className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white py-3">
                <div className="grid grid-cols-12 text-center items-center px-4">
                  <div className="col-span-5 font-semibold text-lg tracking-wide">
                    {t("colWord")}
                  </div>
                  <div className="col-span-5 font-semibold text-lg tracking-wide">
                    {t("colMeaning")}
                  </div>
                  <div className="col-span-2 font-semibold text-lg tracking-wide">
                    {t("colActions")}
                  </div>
                </div>
              </div>

              {visibleEntries.map(({ entry, realIndex }) => {
                const isEditing = editingIndex === realIndex;
                return (
                  <div
                    key={realIndex}
                    className={`grid grid-cols-12 items-center px-4 ${
                      realIndex % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } hover:bg-gray-100 transition-colors duration-200`}
                  >
                    <div className="col-span-5 py-4 text-center">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editTermInput}
                          onChange={(e) => setEditTermInput(e.target.value)}
                          ref={(el) => {
                            desktopFieldRefs.current.term = el;
                          }}
                          onKeyDown={(e) =>
                            handleEditKeyDown(e, "term", realIndex, desktopFieldRefs)
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      ) : (
                        <span className="font-medium text-gray-700 inline-flex items-center justify-center gap-2">
                          {formatCommaList(entry.term)}
                          {entry.note && <NoteTooltip note={entry.note} />}
                          {entry.examples?.length ? (
                            <span
                              title={entry.examples[0].text}
                              className="text-purple-400"
                            >
                              <i className="fas fa-quote-right text-[0.65rem]"></i>
                            </span>
                          ) : null}
                        </span>
                      )}
                    </div>
                    <div className="col-span-5 py-4 text-center">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editTranslationInput}
                          onChange={(e) =>
                            setEditTranslationInput(e.target.value)
                          }
                          ref={(el) => {
                            desktopFieldRefs.current.translation = el;
                          }}
                          onKeyDown={(e) =>
                            handleEditKeyDown(e, "translation", realIndex, desktopFieldRefs)
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      ) : (
                        <span className="font-medium text-gray-700">
                          {formatCommaList(entry.translation)}
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 py-4 text-center">
                      {isEditing ? (
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleSaveEdit(realIndex)}
                            disabled={isPending}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50 cursor-pointer"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-red-600 hover:text-red-800 cursor-pointer"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleStartEdit(realIndex)}
                            className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(realIndex)}
                            disabled={isPending}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <div className="col-span-12 pb-4">
                        <input
                          type="text"
                          value={editNoteInput}
                          onChange={(e) => setEditNoteInput(e.target.value)}
                          maxLength={200}
                          placeholder={t("notePlaceholder")}
                          ref={(el) => {
                            desktopFieldRefs.current.note = el;
                          }}
                          onKeyDown={(e) =>
                            handleEditKeyDown(e, "note", realIndex, desktopFieldRefs)
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <div className="mt-2 space-y-2">
                          <input
                            type="text"
                            value={editExampleInput}
                            onChange={(e) => setEditExampleInput(e.target.value)}
                            maxLength={MAX_EXAMPLE_LENGTH}
                            placeholder={t("examplePlaceholder")}
                            ref={(el) => {
                              desktopFieldRefs.current.example = el;
                            }}
                            onKeyDown={(e) =>
                              handleEditKeyDown(e, "example", realIndex, desktopFieldRefs)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <input
                            type="text"
                            value={editExampleTranslationInput}
                            onChange={(e) =>
                              setEditExampleTranslationInput(e.target.value)
                            }
                            maxLength={MAX_EXAMPLE_LENGTH}
                            placeholder={t("exampleTranslationPlaceholder")}
                            ref={(el) => {
                              desktopFieldRefs.current.exampleTranslation = el;
                            }}
                            onKeyDown={(e) =>
                              handleEditKeyDown(e, "exampleTranslation", realIndex, desktopFieldRefs)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobil: kart görünümü */}
            <div className="md:hidden divide-y divide-gray-100">
              {visibleEntries.map(({ entry, realIndex }) => {
                const isEditing = editingIndex === realIndex;
                return (
                  <div key={realIndex} className="px-4 py-3">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editTermInput}
                          onChange={(e) => setEditTermInput(e.target.value)}
                          placeholder={t("colWord")}
                          ref={(el) => {
                            mobileFieldRefs.current.term = el;
                          }}
                          onKeyDown={(e) =>
                            handleEditKeyDown(e, "term", realIndex, mobileFieldRefs)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                          type="text"
                          value={editTranslationInput}
                          onChange={(e) =>
                            setEditTranslationInput(e.target.value)
                          }
                          placeholder={t("colMeaning")}
                          ref={(el) => {
                            mobileFieldRefs.current.translation = el;
                          }}
                          onKeyDown={(e) =>
                            handleEditKeyDown(e, "translation", realIndex, mobileFieldRefs)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                          type="text"
                          value={editNoteInput}
                          onChange={(e) => setEditNoteInput(e.target.value)}
                          maxLength={200}
                          placeholder={t("notePlaceholder")}
                          ref={(el) => {
                            mobileFieldRefs.current.note = el;
                          }}
                          onKeyDown={(e) =>
                            handleEditKeyDown(e, "note", realIndex, mobileFieldRefs)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                          type="text"
                          value={editExampleInput}
                          onChange={(e) => setEditExampleInput(e.target.value)}
                          maxLength={MAX_EXAMPLE_LENGTH}
                          placeholder={t("examplePlaceholder")}
                          ref={(el) => {
                            mobileFieldRefs.current.example = el;
                          }}
                          onKeyDown={(e) =>
                            handleEditKeyDown(e, "example", realIndex, mobileFieldRefs)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                          type="text"
                          value={editExampleTranslationInput}
                          onChange={(e) =>
                            setEditExampleTranslationInput(e.target.value)
                          }
                          maxLength={MAX_EXAMPLE_LENGTH}
                          placeholder={t("exampleTranslationPlaceholder")}
                          ref={(el) => {
                            mobileFieldRefs.current.exampleTranslation = el;
                          }}
                          onKeyDown={(e) =>
                            handleEditKeyDown(e, "exampleTranslation", realIndex, mobileFieldRefs)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <div className="flex justify-end gap-4 pt-1 text-lg">
                          <button
                            onClick={() => handleSaveEdit(realIndex)}
                            disabled={isPending}
                            className="text-green-600 disabled:opacity-50"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-red-600"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-800 break-words flex items-center gap-2">
                            {formatCommaList(entry.term)}
                            {entry.note && <NoteTooltip note={entry.note} />}
                          {entry.examples?.length ? (
                            <span
                              title={entry.examples[0].text}
                              className="text-purple-400"
                            >
                              <i className="fas fa-quote-right text-[0.65rem]"></i>
                            </span>
                          ) : null}
                          </div>
                          <div className="text-sm text-gray-500 break-words">
                            {formatCommaList(entry.translation)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 text-lg">
                          <button
                            onClick={() => handleStartEdit(realIndex)}
                            className="text-blue-600"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(realIndex)}
                            disabled={isPending}
                            className="text-red-600 disabled:opacity-50"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination kontrolleri */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
                className="text-gray-500 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1"
              >
                <i className="fas fa-chevron-left mr-1"></i> {t("prev")}
              </button>

              {/* Masaüstü: sayfa numaraları */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => goToPage(i)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
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
                className="text-gray-500 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1"
              >
                {t("next")} <i className="fas fa-chevron-right ml-1"></i>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
