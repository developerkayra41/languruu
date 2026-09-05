"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import Avatar from "@/app/components/ui/Avatar";
import { formatRelativeTime } from "@/app/lib/relative-time";
import { respondFriendRequestAction } from "./actions";
import type { NotificationItem } from "@/app/types/social";

const ICONS: Record<string, string> = {
  friend_request: "fa-user-plus",
  friend_accepted: "fa-user-check",
  group_copied: "fa-layer-group",
  message_received: "fa-envelope",
};

interface NotificationRowProps {
  item: NotificationItem;
  onHandled: (id: number) => void;
  onOpen?: () => void;
}

export default function NotificationRow({ item, onHandled, onOpen }: NotificationRowProps) {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const actorName = item.actor_user_name ?? t("deletedUser");
  const isUnread = !item.read_at;

  const message =
    item.type === "friend_request"
      ? t("friendRequestText", { name: actorName })
      : item.type === "friend_accepted"
        ? t("friendAcceptedText", { name: actorName })
        : item.type === "message_received"
          ? t("messageReceivedText", { name: actorName })
          : t("groupCopiedText", { name: actorName, group: item.payload?.group_name ?? "" });

  const respond = (action: "accept" | "reject") => {
    const requestId = item.payload?.request_id;
    if (!requestId) return;
    startTransition(async () => {
      const result = await respondFriendRequestAction(requestId, action);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (action === "accept") toast.success(t("accepted", { name: actorName }));
      onHandled(item.id);
    });
  };

  return (
    <div
      className={`flex gap-3 px-4 py-3 transition ${isUnread ? "bg-purple-50" : "bg-white"}`}
    >
      <div className="relative shrink-0">
        {item.actor_user_name ? (
          <Link href={`/users/${item.actor_user_name}`} onClick={onOpen}>
            <Avatar src={item.actor_avatar_url ?? undefined} name={actorName} size={40} />
          </Link>
        ) : (
          <Avatar name="?" size={40} />
        )}
        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center">
          <i className={`fas ${ICONS[item.type] ?? "fa-bell"}`}></i>
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-700 leading-snug break-words">{message}</p>
        <span className="text-xs text-gray-400">
          {formatRelativeTime(item.created_at, locale)}
        </span>

        {item.type === "friend_request" && item.payload?.request_id && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => respond("accept")}
              disabled={isPending}
              className="px-3 py-1 rounded-md bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
            >
              {t("accept")}
            </button>
            <button
              onClick={() => respond("reject")}
              disabled={isPending}
              className="px-3 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 disabled:opacity-50 cursor-pointer"
            >
              {t("reject")}
            </button>
          </div>
        )}

        {item.type === "message_received" && item.actor_user_name && (
          <Link
            href={`/messages/${item.actor_user_name}`}
            onClick={onOpen}
            className="inline-block mt-1 ml-2 text-xs text-purple-600 hover:underline"
          >
            {t("openThread")}
          </Link>
        )}

        {item.type === "group_copied" && item.payload?.share_id && (
          <Link
            href="/marketplace"
            onClick={onOpen}
            className="inline-block mt-1 ml-2 text-xs text-purple-600 hover:underline"
          >
            {t("viewInMarketplace")}
          </Link>
        )}
      </div>
    </div>
  );
}
