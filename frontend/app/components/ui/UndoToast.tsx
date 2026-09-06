"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export const UNDO_SECONDS = 5;

function UndoToastBody({
  message,
  seconds,
  onUndo,
  onClose,
}: {
  message: string;
  seconds: number;
  onUndo: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("common");
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const timer = setInterval(() => setLeft((value) => (value > 1 ? value - 1 : 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <button
        onClick={onClose}
        aria-label={t("close")}
        title={t("close")}
        className="absolute left-0 top-0 -translate-x-[35%] -translate-y-[35%] w-5 h-5 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
      >
        <i className="fas fa-xmark text-[10px]"></i>
      </button>

      <span className="flex-1 min-w-0 text-sm text-gray-700">{message}</span>

      <span
        aria-hidden
        className="w-6 h-6 shrink-0 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center tabular-nums"
      >
        {left}
      </span>

      <button
        onClick={onUndo}
        aria-label={t("undo")}
        title={t("undo")}
        className="w-8 h-8 shrink-0 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center justify-center transition cursor-pointer"
      >
        <i className="fas fa-rotate-left text-sm"></i>
      </button>
    </div>
  );
}

export function showUndoToast({
  message,
  onUndo,
  onCommit,
  seconds = UNDO_SECONDS,
}: {
  message: string;
  onUndo: () => void;
  onCommit: () => void;
  seconds?: number;
}) {
  let settled = false;
  let timer: ReturnType<typeof setTimeout>;

  const toastId = toast.custom(
    (id) => (
      <UndoToastBody
        message={message}
        seconds={seconds}
        onUndo={() => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          toast.dismiss(id);
          onUndo();
        }}
        onClose={() => toast.dismiss(id)}
      />
    ),
    { duration: seconds * 1000 },
  );

  timer = setTimeout(() => {
    if (settled) return;
    settled = true;
    toast.dismiss(toastId);
    onCommit();
  }, seconds * 1000);
}
