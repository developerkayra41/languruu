import Link from "next/link";
import { getMessageThread } from "@/app/lib/api-client";
import { getTranslations } from "next-intl/server";
import ThreadClient from "./ThreadClient";
import type { MessageThread } from "@/app/types/social";

interface ThreadPageProps {
  params: Promise<{ username: string }>;
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { username } = await params;
  const t = await getTranslations("messages");

  let thread: MessageThread;
  try {
    thread = await getMessageThread(username);
  } catch (err) {
    const notFriends = err instanceof Error && err.message === "NOT_FRIENDS";
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-12 text-center">
          <div className="mb-3 text-gray-300">
            <i className="fas fa-user-lock text-3xl"></i>
          </div>
          <p className="text-sm text-gray-600">
            {notFriends ? t("needFriend") : t("threadUnavailable")}
          </p>
          <Link
            href={`/users/${username}`}
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition"
          >
            {t("goToProfile")}
          </Link>
        </div>
      </div>
    );
  }

  return <ThreadClient thread={thread} />;
}
