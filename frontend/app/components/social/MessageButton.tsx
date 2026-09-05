"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

const BASE =
  "inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm transition cursor-pointer";

export default function MessageButton({
  userName,
  isFriend,
}: {
  userName: string;
  isFriend: boolean;
}) {
  const t = useTranslations("messages");

  if (isFriend) {
    return (
      <Link
        href={`/messages/${userName}`}
        title={t("sendMessage")}
        aria-label={t("sendMessage")}
        className={`${BASE} bg-purple-600 text-white hover:bg-purple-700`}
      >
        <i className="fas fa-envelope"></i>
      </Link>
    );
  }

  return (
    <button
      onClick={() => toast.info(t("needFriend"))}
      title={t("sendMessage")}
      aria-label={t("sendMessage")}
      className={`${BASE} bg-gray-100 text-gray-400 hover:bg-gray-200`}
    >
      <i className="fas fa-envelope"></i>
    </button>
  );
}
