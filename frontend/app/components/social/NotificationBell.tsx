"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import NotificationRow from "./NotificationRow";
import {
  loadNotificationsAction,
  loadUnreadCountAction,
  markAllNotificationsReadAction,
} from "./actions";
import type { NotificationItem } from "@/app/types/social";

const PANEL_SIZE = 10;
const POLL_MS = 60_000;

export default function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setUnread(initialUnread), [initialUnread]);

  useEffect(() => {
    const handleOutside = (e: Event) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) return;
    const timer = setInterval(async () => {
      if (document.hidden) return;
      const result = await loadUnreadCountAction();
      if (result.success) setUnread(result.data.count);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [isOpen]);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await loadNotificationsAction({ limit: PANEL_SIZE });
    if (result.success) {
      setItems(result.data.items);
      setHasMore(result.data.has_more);
      if (result.data.unread_count > 0) {
        const read = await markAllNotificationsReadAction();
        if (read.success) setUnread(0);
      } else {
        setUnread(0);
      }
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  }, []);

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) void load();
  };

  const handleHandled = (id: number) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    startTransition(() => router.refresh());
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={toggle}
        aria-label={t("title")}
        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition cursor-pointer"
      >
        <i className="fas fa-bell text-base"></i>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-800">{t("title")}</span>
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs text-purple-600 hover:underline"
            >
              {t("seeAll")}
            </Link>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {isLoading && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                {t("loading")}
              </div>
            )}

            {!isLoading && items.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                <div className="mb-2 text-gray-300">
                  <i className="fas fa-bell-slash text-2xl"></i>
                </div>
                {t("empty")}
              </div>
            )}

            {!isLoading &&
              items.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onHandled={handleHandled}
                  onOpen={() => setIsOpen(false)}
                />
              ))}
          </div>

          {hasMore && (
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-center text-xs text-purple-600 border-t border-gray-200 hover:bg-gray-50"
            >
              {t("seeAll")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
