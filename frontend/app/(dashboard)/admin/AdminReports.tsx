"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import type { AdminReport } from "@/app/lib/api-client";
import { deleteReportedMessageAction, resolveReportAction } from "./actions";

const reasonKeys: Record<string, string> = {
  adult_content: "reasonAdult",
  profanity: "reasonProfanity",
  spam: "reasonSpam",
  other: "reasonOther",
};

export default function AdminReports({ initial }: { initial: AdminReport[] }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const numLocale = locale === "tr" ? "tr-TR" : "en-US";
  const [reports, setReports] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const removeMessage = (reportId: number, messageId: number) => {
    startTransition(async () => {
      const r = await deleteReportedMessageAction(reportId, messageId);
      if (r.success) {
        setReports((prev) => prev.filter((x) => x.id !== reportId));
        toast.success(t("messageDeleted"));
      } else toast.error(r.error);
    });
  };

  const resolve = (id: number, status: string) => {
    startTransition(async () => {
      const r = await resolveReportAction(id, status);
      if (r.success) {
        setReports((prev) => prev.filter((x) => x.id !== id));
        toast.success(status === "dismissed" ? t("reportDismissed") : t("reportResolved"));
      } else toast.error(r.error);
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        {t("openReports")}
        {reports.length > 0 && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{reports.length}</span>}
      </h2>
      {reports.length === 0 ? (
        <p className="text-sm text-gray-400">{t("noReports")}</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className={`border rounded-lg p-3 ${r.reason === "adult_content" ? "border-red-200 bg-red-50/40" : "border-gray-100"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="font-medium text-red-600">{reasonKeys[r.reason] ? t(reasonKeys[r.reason]) : r.reason}</span>
                    <span className="text-gray-300">·</span>
                    {r.target_type === "profile" && (
                      <Link href={`/users/${r.target_ref}`} className="text-purple-600 hover:underline">@{r.target_ref}</Link>
                    )}
                    {r.target_type === "word_group" && (
                      <span className="text-gray-600">{t("group")} <code className="text-xs">{r.target_ref}</code></span>
                    )}
                    {r.target_type === "global_message" && (
                      <span className="text-gray-600">
                        {t("globalMessage")}
                        {r.message_author && (
                          <> <Link href={`/users/${r.message_author}`} className="text-purple-600 hover:underline">@{r.message_author}</Link></>
                        )}
                      </span>
                    )}
                  </div>
                  {r.target_type === "global_message" && (
                    <p className="mt-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {r.message_body ?? <span className="italic text-gray-400">{t("messageGone")}</span>}
                    </p>
                  )}
                  {r.description && <p className="text-sm text-gray-600 mt-1">{r.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {t("reportedBy")} @{r.reporter_username ?? "-"} · {new Date(r.created_at).toLocaleString(numLocale, { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {r.target_type === "global_message" && r.message_body !== null && (
                    <button onClick={() => removeMessage(r.id, Number(r.target_ref))} disabled={isPending}
                      className="text-xs px-3 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50">{t("deleteMessage")}</button>
                  )}
                  <button onClick={() => resolve(r.id, "reviewed")} disabled={isPending}
                    className="text-xs px-3 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50">{t("resolved")}</button>
                  <button onClick={() => resolve(r.id, "dismissed")} disabled={isPending}
                    className="text-xs px-3 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50">{t("dismiss")}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}