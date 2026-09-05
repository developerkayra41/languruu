"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { loadUnreadMessagesAction } from "./actions";

const POLL_MS = 60_000;

export default function MessagesMenuItem({
  initialUnread,
  menuOpen,
}: {
  initialUnread: number;
  menuOpen: boolean;
}) {
  const t = useTranslations("nav");
  const [unread, setUnread] = useState(initialUnread);

  useEffect(() => setUnread(initialUnread), [initialUnread]);

  const load = useCallback(async () => {
    const result = await loadUnreadMessagesAction();
    if (result.success) setUnread(result.data.unread_senders);
  }, []);

  useEffect(() => {
    if (menuOpen) void load();
  }, [menuOpen, load]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <Link
      href="/messages"
      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
    >
      <i className="fas fa-envelope mr-2 w-4"></i>
      {t("messages")}
      {unread > 0 && (
        <span className="ml-auto min-w-[20px] px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold text-center">
          {unread}
        </span>
      )}
    </Link>
  );
}
