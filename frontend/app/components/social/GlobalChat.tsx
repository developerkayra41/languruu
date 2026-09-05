"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import Avatar from "@/app/components/ui/Avatar";
import { useConfirm } from "@/app/components/ui/useConfirm";
import {
  deleteGlobalMessageAction,
  editGlobalMessageAction,
  loadGlobalChatAction,
  sendGlobalMessageAction,
} from "@/app/components/social/actions";
import ReportDialog from "@/app/components/report/ReportDialog";
import type { GlobalMessageItem } from "@/app/types/social";

const POLL_MS = 10_000;
const MAX_LENGTH = 1000;

export default function GlobalChat() {
  const t = useTranslations("globalChat");
  const locale = useLocale();
  const { confirm, confirmDialog } = useConfirm();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [messages, setMessages] = useState<GlobalMessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [menuId, setMenuId] = useState<number | null>(null);
  const [reportId, setReportId] = useState<number | null>(null);
  const [isSending, startSending] = useTransition();
  const [isSavingEdit, startSavingEdit] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  const timeFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }),
    [locale],
  );
  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }),
    [locale],
  );

  const refresh = useCallback(async () => {
    const result = await loadGlobalChatAction();
    if (!result.success) return;
    setIsLoaded(true);
    setIsModerator(result.data.is_moderator);
    setMessages((prev) => {
      const next = result.data.messages;
      const sameLength = prev.length === next.length;
      const sameTail = prev[prev.length - 1]?.id === next[next.length - 1]?.id;
      return sameLength && sameTail ? prev : next;
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void refresh();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [isOpen, refresh]);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [isOpen, messages.length]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditDraft("");
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-global-message-menu]")) setMenuId(null);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (reportId !== null) setReportId(null);
      else if (menuId !== null) setMenuId(null);
      else if (editingId !== null) cancelEdit();
      else setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, menuId, editingId, reportId, cancelEdit]);

  const showError = (error: string) =>
    toast.error(error === "PROFANITY" ? t("profanity") : error);

  const send = () => {
    const body = draft.trim();
    if (!body || isSending) return;
    startSending(async () => {
      const result = await sendGlobalMessageAction(body);
      if (!result.success) {
        showError(result.error);
        return;
      }
      setDraft("");
      setMessages((prev) => [...prev, result.data]);
    });
  };

  const startEdit = (message: GlobalMessageItem) => {
    setMenuId(null);
    setEditingId(message.id);
    setEditDraft(message.body);
  };

  const saveEdit = (message: GlobalMessageItem) => {
    const body = editDraft.trim();
    if (!body || isSavingEdit) return;
    if (body === message.body) {
      cancelEdit();
      return;
    }
    startSavingEdit(async () => {
      const result = await editGlobalMessageAction(message.id, body);
      if (!result.success) {
        showError(result.error);
        return;
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id
            ? { ...m, body: result.data.body, edited_at: result.data.edited_at }
            : m,
        ),
      );
      cancelEdit();
    });
  };

  const remove = async (message: GlobalMessageItem) => {
    setMenuId(null);
    const question = message.from_me
      ? t("deleteConfirm")
      : t("deleteConfirmAsAdmin", { name: message.full_name });
    if (!(await confirm({ message: question, danger: true }))) return;
    const result = await deleteGlobalMessageAction(message.id);
    if (!result.success) {
      showError(result.error);
      return;
    }
    if (editingId === message.id) cancelEdit();
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
  };

  const todayKey = new Date().toDateString();
  const yesterdayKey = new Date(Date.now() - 86_400_000).toDateString();
  const dayLabel = (date: Date) => {
    const key = date.toDateString();
    if (key === todayKey) return t("today");
    if (key === yesterdayKey) return t("yesterday");
    return dateFormat.format(date);
  };

  let lastDayKey = "";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label={t("open")}
        title={t("open")}
        className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 cursor-pointer ${
          isOpen ? "opacity-0 pointer-events-none scale-90" : "opacity-100"
        }`}
      >
        <i className="fas fa-comments text-xl"></i>
      </button>

      <div
        onClick={() => setIsOpen(false)}
        aria-hidden
        className={`sm:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        aria-hidden={!isOpen}
        className={`fixed top-0 right-0 h-screen z-50 w-full sm:w-1/4 sm:min-w-[340px] bg-white border-l border-gray-200 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white">
          <span className="flex items-center gap-2 min-w-0">
            <i className="fas fa-globe"></i>
            <span className="font-semibold truncate">{t("title")}</span>
          </span>
          <button
            onClick={() => setIsOpen(false)}
            aria-label={t("close")}
            className="w-9 h-9 shrink-0 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
          >
            <i className="fas fa-xmark"></i>
          </button>
        </div>

        <div className="px-4 py-2 bg-gray-50 text-[11px] text-gray-400 text-center border-b border-gray-200">
          <i className="fas fa-clock-rotate-left mr-1"></i>
          {t("retentionNotice")}
        </div>

        <div className="pretty-scroll flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!isLoaded && (
            <div className="py-10 text-center text-sm text-gray-400">
              <i className="fas fa-spinner fa-spin mr-2"></i>
              {t("loading")}
            </div>
          )}

          {isLoaded && messages.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-400">
              <div className="mb-3 text-gray-300">
                <i className="fas fa-comments text-3xl"></i>
              </div>
              {t("empty")}
            </div>
          )}

          {messages.map((message, index) => {
            const created = new Date(message.created_at);
            const dayKey = created.toDateString();
            const showDivider = dayKey !== lastDayKey;
            lastDayKey = dayKey;
            const isEditing = editingId === message.id;
            const isLast = index === messages.length - 1;
            const previous = messages[index - 1];
            const sameAuthorAsPrevious =
              !showDivider && previous?.user_name === message.user_name;

            return (
              <div key={message.id}>
                {showDivider && (
                  <div className="flex justify-center my-3">
                    <span className="px-3 py-1 rounded-full bg-gray-100 text-[11px] text-gray-500">
                      {dayLabel(created)}
                    </span>
                  </div>
                )}

                <div
                  className={`flex items-end gap-1.5 ${
                    message.from_me ? "justify-end" : "justify-start"
                  }`}
                >
                  {!message.from_me && (
                    <span className="w-7 shrink-0">
                      {!sameAuthorAsPrevious && (
                        <Link href={`/users/${message.user_name}`} title={message.full_name}>
                          <Avatar
                            src={message.avatar_url ?? undefined}
                            name={message.user_name}
                            size={28}
                          />
                        </Link>
                      )}
                    </span>
                  )}

                  <div className={isEditing ? "w-full" : "max-w-[80%]"}>
                    {!message.from_me && !sameAuthorAsPrevious && (
                      <Link
                        href={`/users/${message.user_name}`}
                        className="block mb-0.5 text-[11px] font-semibold text-purple-600 hover:underline truncate"
                      >
                        {message.full_name}
                      </Link>
                    )}

                    {isEditing ? (
                      <div className="rounded-2xl border border-purple-200 bg-white p-2">
                        <textarea
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value.slice(0, MAX_LENGTH))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              saveEdit(message);
                            }
                          }}
                          rows={2}
                          autoFocus
                          className="pretty-scroll w-full resize-none px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-300"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 rounded-md text-xs text-gray-600 hover:bg-gray-100 cursor-pointer"
                          >
                            {t("cancelEdit")}
                          </button>
                          <button
                            onClick={() => saveEdit(message)}
                            disabled={isSavingEdit || editDraft.trim().length === 0}
                            className="px-3 py-1 rounded-md bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
                          >
                            {t("saveEdit")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`relative px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                          message.from_me
                            ? "bg-purple-500 text-white rounded-2xl rounded-br-sm"
                            : "bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm"
                        } pr-9`}
                      >
                        {message.body}
                        {message.edited_at && (
                          <span
                            className={`block mt-1 text-[11px] italic ${
                              message.from_me ? "text-purple-200" : "text-gray-400"
                            }`}
                          >
                            ({t("edited")})
                          </span>
                        )}

                        <span data-global-message-menu>
                          <button
                            onClick={() =>
                              setMenuId((prev) => (prev === message.id ? null : message.id))
                            }
                            aria-label={t("actions")}
                            aria-expanded={menuId === message.id}
                            className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer ${
                              message.from_me
                                ? "text-white/70 hover:text-white hover:bg-white/20"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            <i className="fas fa-ellipsis-vertical text-xs"></i>
                          </button>

                          {menuId === message.id && (
                            <span
                              className={`absolute right-1 z-20 flex items-center gap-1 rounded-lg bg-white shadow-lg border border-gray-200 p-1 ${
                                isLast ? "bottom-full mb-1" : "top-8"
                              }`}
                            >
                              {message.from_me && (
                                <button
                                  onClick={() => startEdit(message)}
                                  aria-label={t("edit")}
                                  title={t("edit")}
                                  className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-purple-600 transition cursor-pointer"
                                >
                                  <i className="fas fa-pen text-xs"></i>
                                </button>
                              )}
                              {!message.from_me && (
                                <button
                                  onClick={() => {
                                    setMenuId(null);
                                    setReportId(message.id);
                                  }}
                                  aria-label={t("report")}
                                  title={t("report")}
                                  className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-orange-500 transition cursor-pointer"
                                >
                                  <i className="fas fa-flag text-xs"></i>
                                </button>
                              )}
                              {(message.from_me || isModerator) && (
                                <button
                                  onClick={() => remove(message)}
                                  aria-label={t("delete")}
                                  title={t("delete")}
                                  className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-red-500 transition cursor-pointer"
                                >
                                  <i className="fas fa-trash text-xs"></i>
                                </button>
                              )}
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {!isEditing && (
                      <span
                        className={`block mt-0.5 text-[11px] text-gray-400 ${
                          message.from_me ? "text-right" : "text-left"
                        }`}
                        title={created.toLocaleString(locale)}
                      >
                        {timeFormat.format(created)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div
          className="border-t border-gray-200 p-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={t("placeholder")}
              className="pretty-scroll flex-1 resize-none px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-300 max-h-32"
            />
            <button
              onClick={send}
              disabled={isSending || draft.trim().length === 0}
              aria-label={t("send")}
              className="w-10 h-10 shrink-0 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition disabled:opacity-50 cursor-pointer"
            >
              {isSending ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-paper-plane"></i>
              )}
            </button>
          </div>
          {draft.length > MAX_LENGTH - 100 && (
            <span className="block mt-1 text-right text-xs text-gray-400">
              {draft.length} / {MAX_LENGTH}
            </span>
          )}
        </div>
      </aside>

      {reportId !== null && (
        <ReportDialog
          targetType="global_message"
          targetRef={String(reportId)}
          onClose={() => setReportId(null)}
        />
      )}

      {confirmDialog}
    </>
  );
}
