"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function BackButton({ fallback = "/study" }: { fallback?: string }) {
  const router = useRouter();
  const t = useTranslations("common");

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallback);
  };

  return (
    <button
      onClick={goBack}
      aria-label={t("back")}
      title={t("back")}
      className="w-9 h-9 shrink-0 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition cursor-pointer"
    >
      <i className="fas fa-arrow-left"></i>
    </button>
  );
}
