"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import ReportDialog from "./ReportDialog";
import type { ReportTargetType } from "./types";

export default function ReportButton({
  targetType,
  targetRef,
  className = "",
}: {
  targetType: ReportTargetType;
  targetRef: string;
  className?: string;
}) {
  const t = useTranslations("report");
  const [open, setOpen] = useState(false);

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
      {open && (
        <ReportDialog
          targetType={targetType}
          targetRef={targetRef}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
