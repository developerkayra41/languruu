"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { unsubscribeAction } from "./actions";

type Status = "idle" | "done" | "error";

export default function UnsubscribeClient({ token }: { token: string }) {
  const t = useTranslations("unsubscribe");
  const [status, setStatus] = useState<Status>("idle");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const r = await unsubscribeAction(token);
      if (r.success) { setEmail(r.email); setStatus("done"); }
      else setStatus("error");
    });
  };

  if (status === "done") {
    return (
      <Panel icon="fa-circle-check" tone="green" title={t("doneTitle")}>
        <p className="text-gray-500 mb-6">{t("doneText", { email })}</p>
        <Link href="/" className="inline-block bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:scale-[1.02]">
          {t("backHome")}
        </Link>
      </Panel>
    );
  }

  if (status === "error") {
    return (
      <Panel icon="fa-triangle-exclamation" tone="red" title={t("errorTitle")}>
        <p className="text-gray-500 mb-6">{t("errorText")}</p>
        <Link href="/settings" className="text-purple-600 hover:underline text-sm">{t("goSettings")}</Link>
      </Panel>
    );
  }

  return (
    <Panel icon="fa-envelope-open-text" tone="purple" title={t("title")}>
      <p className="text-gray-500 mb-6">{t("text")}</p>
      <button
        onClick={submit}
        disabled={isPending}
        className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
      >
        {isPending ? t("pending") : t("confirm")}
      </button>
      <div className="mt-4">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">{t("cancel")}</Link>
      </div>
    </Panel>
  );
}

const tones: Record<string, string> = {
  purple: "bg-purple-100 text-purple-600",
  green: "bg-green-100 text-green-600",
  red: "bg-red-100 text-red-500",
};

function Panel({ icon, tone, title, children }: { icon: string; tone: string; title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto ${tones[tone]}`}>
        <i className={`fas ${icon} text-2xl`}></i>
      </div>
      <h1 className="text-xl font-semibold text-gray-800 mb-2">{title}</h1>
      {children}
    </div>
  );
}
