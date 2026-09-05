"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import Avatar from "@/app/components/ui/Avatar";
import { useConfirm } from "@/app/components/ui/useConfirm";
import {
  deleteMessageAction,
  editMessageAction,
  loadThreadAction,
  sendMessageAction,
} from "@/app/components/social/actions";
import type { MessageItem, MessageThread } from "@/app/types/social";

const POLL_MS = 15_000;
const MAX_LENGTH = 1000;

export default function ThreadClient({ thread }: { thread: MessageThread }) {
  const t = useTranslations("messages");
  const locale = useLocale();
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirm();

  const [messages, setMessages] = useState<MessageItem[]>(thread.messages);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [menuId, setMenuId] = useState<number | null>(null);
  const [isSending, startSending] = useTransition();
  const [isSavingEdit, startSavingEdit] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  const peer = thread.peer;

  const timeFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }),
    [locale],
  );
  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }),
    [locale],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    const handleOutside = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-message-menu]")) setMenuId(null);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuId(null);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const refresh = useCallback(async () => {
    const result = await loadThreadAction(peer.user_name);
    if (!result.success) return;
    setMessages((prev) => {
      const next = result.data.messages;
      const sameLength = prev.length === next.length;
      const sameTail = prev[prev.length - 1]?.id === next[next.length - 1]?.id;
      return sameLength && sameTail ? prev : next;
    });
  }, [peer.user_name]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const send = () => {
    const body = draft.trim();
    if (!body || isSending) return;
    startSending(async () => {
      const result = await sendMessageAction(peer.user_name, body);
      if (!result.success) {
        toast.error(result.error === "NOT_FRIENDS" ? t("needFriend") : result.error);
        return;
      }
      setDraft("");
      setMessages((prev) => [...prev, result.data]);
      router.refresh();
    });
  };

  const startEdit = (message: MessageItem) => {
    setMenuId(null);
    setEditingId(message.id);
    setEditDraft(message.body);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft("");
  };

  const saveEdit = (message: MessageItem) => {
    const body = editDraft.trim();
    if (!body || isSavingEdit) return;
    if (body === message.body) {
      cancelEdit();
      return;
    }
    startSavingEdit(async () => {
      const result = await editMessageAction(message.id, body);
      if (!result.success) {
        toast.error(result.error);
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

  const remove = async (message: MessageItem) => {
    setMenuId(null);
    if (!(await confirm({ message: t("deleteConfirm"), danger: true }))) return;
    const result = await deleteMessageAction(message.id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    if (editingId === message.id) cancelEdit();
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
    router.refresh();
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
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <Link
            href="/messages"
            replace
            aria-label={t("back")}
            className="w-9 h-9 shrink-0 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition"
          >
            <i className="fas fa-arrow-left"></i>
          </Link>
          <Link href={`/users/${peer.user_name}`} className="flex items-center gap-3 min-w-0">
            <Avatar
              src={peer.avatar_url ?? undefined}
              name={peer.user_name}
              size={40}
              className="shrink-0"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-gray-800 truncate">
                {peer.full_name}
              </span>
              <span className="block text-xs text-gray-500 truncate">@{peer.user_name}</span>
            </span>
          </Link>
        </div>

        <div className="px-4 py-2 bg-gray-50 text-[11px] text-gray-400 text-center border-b border-gray-200">
          <i className="fas fa-clock-rotate-left mr-1"></i>
          {t("retentionNotice")}
        </div>

        <div className="pretty-scroll max-h-[55vh] overflow-y-auto px-4 py-4 space-y-1">
          {messages.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-400">
              <div className="mb-3 text-gray-300">
                <i className="fas fa-comments text-3xl"></i>
              </div>
              {t("threadEmpty", { name: peer.full_name })}
            </div>
          )}

          {messages.map((message, index) => {
            const created = new Date(message.created_at);
            const dayKey = created.toDateString();
            const showDivider = dayKey !== lastDayKey;
            lastDayKey = dayKey;
            const isEditing = editingId === message.id;
            const isLast = index === messages.length - 1;

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
                  <div className={isEditing ? "w-full max-w-md" : "max-w-[75%]"}>
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
                            if (e.key === "Escape") cancelEdit();
                          }}
                          rows={2}
                          autoFocus
                          className="w-full resize-none px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-300"
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
                            ? "bg-purple-500 text-white rounded-2xl rounded-br-sm pr-9"
                            : "bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm"
                        }`}
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

                        {message.from_me && (
                          <span data-message-menu>
                            <button
                              onClick={() =>
                                setMenuId((prev) => (prev === message.id ? null : message.id))
                              }
                              aria-label={t("actions")}
                              aria-expanded={menuId === message.id}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition cursor-pointer"
                            >
                              <i className="fas fa-ellipsis-vertical text-xs"></i>
                            </button>

                            {menuId === message.id && (
                              <span
                                className={`absolute right-1 z-20 flex items-center gap-1 rounded-lg bg-white shadow-lg border border-gray-200 p-1 ${
                                  isLast ? "bottom-full mb-1" : "top-8"
                                }`}
                              >
                                <button
                                  onClick={() => startEdit(message)}
                                  aria-label={t("edit")}
                                  title={t("edit")}
                                  className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-purple-600 transition cursor-pointer"
                                >
                                  <i className="fas fa-pen text-xs"></i>
                                </button>
                                <button
                                  onClick={() => remove(message)}
                                  aria-label={t("delete")}
                                  title={t("delete")}
                                  className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-red-500 transition cursor-pointer"
                                >
                                  <i className="fas fa-trash text-xs"></i>
                                </button>
                              </span>
                            )}
                          </span>
                        )}
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

        <div className="border-t border-gray-200 p-3">
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
      </div>

      {confirmDialog}
    </div>
  );
}
