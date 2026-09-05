"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Avatar from "@/app/components/ui/Avatar";
import BackButton from "@/app/components/ui/BackButton";
import { formatRelativeTime } from "@/app/lib/relative-time";
import type { ConversationSummary } from "@/app/types/social";

export default function MessagesClient({
  initialConversations,
}: {
  initialConversations: ConversationSummary[];
}) {
  const t = useTranslations("messages");
  const locale = useLocale();

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <BackButton />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-800">{t("pageTitle")}</h1>
          <p className="text-sm text-gray-500">{t("retentionNotice")}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {initialConversations.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-400">
            <div className="mb-3 text-gray-300">
              <i className="fas fa-envelope-open text-3xl"></i>
            </div>
            {t("empty")}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {initialConversations.map((conversation) => (
              <Link
                key={conversation.conversation_id}
                href={`/messages/${conversation.user_name}`}
                replace
                className={`flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50 ${
                  conversation.unread ? "bg-purple-50" : ""
                }`}
              >
                <Avatar
                  src={conversation.avatar_url ?? undefined}
                  name={conversation.user_name}
                  size={44}
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800 truncate">
                      {conversation.full_name}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {formatRelativeTime(conversation.last_message_at, locale)}
                    </span>
                  </div>
                  <p
                    className={`text-sm truncate ${
                      conversation.unread ? "text-gray-800 font-medium" : "text-gray-500"
                    }`}
                  >
                    {conversation.last_from_me && (
                      <span className="text-gray-400">{t("youPrefix")} </span>
                    )}
                    {conversation.last_body}
                  </p>
                </div>
                {conversation.unread && (
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0"></span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
