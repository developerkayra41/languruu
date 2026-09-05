"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import Avatar from "@/app/components/ui/Avatar";
import BackButton from "@/app/components/ui/BackButton";
import { useConfirm } from "@/app/components/ui/useConfirm";
import NotificationRow from "@/app/components/social/NotificationRow";
import {
  markAllNotificationsReadAction,
  removeFriendAction,
  respondFriendRequestAction,
} from "@/app/components/social/actions";
import { formatRelativeTime } from "@/app/lib/relative-time";
import type {
  FriendRequestSummary,
  FriendSummary,
  NotificationItem,
} from "@/app/types/social";

type Tab = "feed" | "requests" | "friends";

interface NotificationsClientProps {
  initialTab?: Tab;
  initialNotifications: NotificationItem[];
  initialRequests: FriendRequestSummary[];
  initialFriends: FriendSummary[];
}

export default function NotificationsClient({
  initialTab,
  initialNotifications,
  initialRequests,
  initialFriends,
}: NotificationsClientProps) {
  const t = useTranslations("notifications");
  const tf = useTranslations("friends");
  const locale = useLocale();
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirm();

  const [tab, setTab] = useState<Tab>(
    initialTab ?? (initialRequests.length > 0 ? "requests" : "feed"),
  );
  const [items, setItems] = useState(initialNotifications);
  const [requests, setRequests] = useState(initialRequests);
  const [friends, setFriends] = useState(initialFriends);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!initialNotifications.some((n) => !n.read_at)) return;
    void markAllNotificationsReadAction().then(() =>
      startTransition(() => router.refresh()),
    );
  }, [initialNotifications, router]);

  const respond = (request: FriendRequestSummary, action: "accept" | "reject") => {
    setPendingId(request.request_id);
    startTransition(async () => {
      const result = await respondFriendRequestAction(request.request_id, action);
      setPendingId(null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setRequests((prev) => prev.filter((r) => r.request_id !== request.request_id));
      setItems((prev) =>
        prev.filter((n) => n.payload?.request_id !== request.request_id),
      );
      if (action === "accept") {
        toast.success(t("accepted", { name: request.user_name }));
        setFriends((prev) =>
          prev.some((f) => f.user_name === request.user_name)
            ? prev
            : [
                ...prev,
                {
                  id: request.request_id,
                  user_name: request.user_name,
                  full_name: request.full_name,
                  avatar_url: request.avatar_url,
                  friends_since: new Date().toISOString(),
                },
              ].sort((a, b) => a.user_name.localeCompare(b.user_name)),
        );
      }
      router.refresh();
    });
  };

  const unfriend = async (friend: FriendSummary) => {
    if (
      !(await confirm({
        message: tf("removeConfirm", { name: friend.user_name }),
        danger: true,
      }))
    )
      return;
    startTransition(async () => {
      const result = await removeFriendAction(friend.user_name);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setFriends((prev) => prev.filter((f) => f.user_name !== friend.user_name));
      router.refresh();
    });
  };

  const handleHandled = (id: number) => {
    const removed = items.find((n) => n.id === id);
    const removedRequestId = removed?.payload?.request_id;
    setItems((prev) => prev.filter((n) => n.id !== id));
    if (removedRequestId) {
      setRequests((prev) => prev.filter((r) => r.request_id !== removedRequestId));
    }
    router.refresh();
  };

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: "feed", label: t("title") },
    { key: "requests", label: tf("requestsTab"), badge: requests.length },
    { key: "friends", label: tf("friendsTab"), badge: friends.length },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <BackButton />
        <h1 className="text-2xl font-bold text-gray-800">{t("pageTitle")}</h1>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition cursor-pointer ${
              tab === item.key
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {item.label}
            {item.badge ? (
              <span
                className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  tab === item.key
                    ? "bg-white text-purple-600"
                    : "bg-purple-100 text-purple-600"
                }`}
              >
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {tab === "feed" && (
          <div className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                <div className="mb-3 text-gray-300">
                  <i className="fas fa-bell-slash text-3xl"></i>
                </div>
                {t("empty")}
              </div>
            ) : (
              items.map((item) => (
                <NotificationRow key={item.id} item={item} onHandled={handleHandled} />
              ))
            )}
          </div>
        )}

        {tab === "requests" && (
          <div className="divide-y divide-gray-100">
            {requests.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                <div className="mb-3 text-gray-300">
                  <i className="fas fa-user-clock text-3xl"></i>
                </div>
                {tf("noRequests")}
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.request_id} className="flex items-center gap-3 px-4 py-3">
                  <Link href={`/users/${request.user_name}`} className="shrink-0">
                    <Avatar
                      src={request.avatar_url ?? undefined}
                      name={request.user_name}
                      size={44}
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/users/${request.user_name}`}
                      className="block text-sm font-semibold text-gray-800 truncate hover:text-purple-600"
                    >
                      {request.full_name}
                    </Link>
                    <span className="text-xs text-gray-500">@{request.user_name}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {formatRelativeTime(request.created_at, locale)}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => respond(request, "accept")}
                      disabled={pendingId === request.request_id}
                      className="px-3 py-1.5 rounded-md bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
                    >
                      {t("accept")}
                    </button>
                    <button
                      onClick={() => respond(request, "reject")}
                      disabled={pendingId === request.request_id}
                      className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 disabled:opacity-50 cursor-pointer"
                    >
                      {t("reject")}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "friends" && (
          <div className="divide-y divide-gray-100">
            {friends.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                <div className="mb-3 text-gray-300">
                  <i className="fas fa-user-group text-3xl"></i>
                </div>
                {tf("noFriends")}
              </div>
            ) : (
              friends.map((friend) => (
                <div key={friend.user_name} className="flex items-center gap-3 px-4 py-3">
                  <Link href={`/users/${friend.user_name}`} className="shrink-0">
                    <Avatar
                      src={friend.avatar_url ?? undefined}
                      name={friend.user_name}
                      size={44}
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/users/${friend.user_name}`}
                      className="block text-sm font-semibold text-gray-800 truncate hover:text-purple-600"
                    >
                      {friend.full_name}
                    </Link>
                    <span className="text-xs text-gray-500">@{friend.user_name}</span>
                  </div>
                  <button
                    onClick={() => unfriend(friend)}
                    className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 cursor-pointer shrink-0"
                  >
                    {tf("remove")}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {confirmDialog}
    </div>
  );
}
