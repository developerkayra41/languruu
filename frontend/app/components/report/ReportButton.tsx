"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { submitReportAction } from "./actions";
import { createPortal } from "react-dom";

const REASONS = [
  { value: "adult_content", key: "adultContent" },
  { value: "profanity", key: "profanity" },
  { value: "spam", key: "spam" },
  { value: "other", key: "other" },
];

export default function ReportButton({
  targetType,
  targetRef,
  className = "",
}: {
  targetType: "profile" | "word_group";
  targetRef: string;
  className?: string;
}) {
  const t = useTranslations("report");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("adult_content");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const r = await submitReportAction({
        target_type: targetType,
        target_ref: targetRef,
        reason,
        description: description || undefined,
      });
      if (r.success) {
        toast.success(t("success"));
        setOpen(false);
        setDescription("");
      } else toast.error(r.error);
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          className || "text-xs text-gray-400 hover:text-red-500 transition"
        }
      >
        <i className="fas fa-flag mr-1"></i>{t("button")}
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="bg-white rounded-lg p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t("title")}
              </h3>
              <div className="space-y-2 mb-4">
                {REASONS.map((r) => (
                  <label
                    key={r.value}
                    className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                    />
                    {t(r.key)}
                  </label>
                ))}
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={t("descriptionPlaceholder")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={submit}
                  disabled={isPending}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isPending ? t("submitting") : t("submit")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
