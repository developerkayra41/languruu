"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");
  const router = useRouter();

  useEffect(() => {
    if (error.message.toLowerCase().includes("unauth")) {
      router.replace("/login");
    }
  }, [error, router]);

  if (error.message.toLowerCase().includes("unauth")) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow-lg p-8 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4">
        <i className="fas fa-exclamation-triangle text-2xl"></i>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{t("title")}</h2>
      <p className="text-gray-500 mb-6">{t("text")}</p>
      <button onClick={reset} className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-3 rounded-full font-medium">
        {t("retry")}
      </button>
    </div>
  );
}