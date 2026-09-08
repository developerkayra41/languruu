"use client";
import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import type { AdminReengagement as Reengagement } from "@/app/types/admin";
import { useConfirm } from "@/app/components/ui/useConfirm";
import { runReengagementAction, sendReengagementAction } from "./actions";

export default function AdminReengagement({ initial }: { initial: Reengagement }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const numLocale = locale === "tr" ? "tr-TR" : "en-US";
  const { confirm, confirmDialog } = useConfirm();
  const [eligible, setEligible] = useState(initial.eligible);
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  const runBatch = async () => {
    if (eligible === 0) return;
    const ok = await confirm({
      title: t("reengagementTitle"),
      message: t("reengagementConfirm", { count: eligible }),
      confirmText: t("reengagementSendAll"),
    });
    if (!ok) return;
    startTransition(async () => {
      const r = await runReengagementAction();
      if (r.success) {
        setEligible((n) => Math.max(0, n - r.sent));
        if (r.failed > 0) toast.warning(t("reengagementPartial", { sent: r.sent, failed: r.failed }));
        else toast.success(t("reengagementBatchSent", { count: r.sent }));
      } else toast.error(r.error);
    });
  };

  const sendOne = (e: React.FormEvent) => {
    e.preventDefault();
    const target = email.trim();
    if (!target) return;
    startTransition(async () => {
      const r = await sendReengagementAction(target);
      if (r.success) {
        setEmail("");
        toast.success(
          r.matched_user
            ? t("reengagementSentTo", { email: target })
            : t("reengagementSentToGuest", { email: target }),
        );
      } else {
        toast.error(
          r.error === "REENGAGEMENT_OPTED_OUT" ? t("reengagementOptedOut") : r.error,
        );
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      {confirmDialog}
      <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
          <i className="fas fa-paper-plane text-sm"></i>
        </span>
        {t("reengagementTitle")}
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        {t("reengagementSubtitle", { days: initial.inactive_days, cooldown: initial.cooldown_days })}
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg bg-purple-50/50 border border-purple-100 mb-4">
        <div className="flex-1">
          <div className="text-2xl font-bold text-gray-900 tabular-nums">
            {eligible.toLocaleString(numLocale)}
          </div>
          <div className="text-xs text-gray-500">{t("reengagementEligible", { days: initial.inactive_days })}</div>
        </div>
        <button
          onClick={runBatch}
          disabled={isPending || eligible === 0}
          className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap"
        >
          {t("reengagementSendAll")}
        </button>
      </div>

      <form onSubmit={sendOne} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("reengagementEmailPlaceholder")}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          disabled={isPending || !email.trim()}
          className="px-4 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-900 disabled:opacity-50 whitespace-nowrap"
        >
          {t("reengagementSendOne")}
        </button>
      </form>
      <p className="text-xs text-gray-400 mt-2">{t("reengagementManualHint")}</p>
    </div>
  );
}
