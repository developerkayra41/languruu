"use client";

import { useTranslations } from "next-intl";

export default function PresenceDot({ size = 40 }: { size?: number }) {
  const t = useTranslations("presence");
  const dot = Math.min(20, Math.max(8, Math.round(size * 0.26)));
  const ring = Math.max(2, Math.round(dot * 0.2));
  const offset = Math.round(size * 0.04);

  return (
    <span
      title={t("online")}
      aria-label={t("online")}
      role="img"
      style={{ width: dot, height: dot, borderWidth: ring, right: offset, bottom: offset }}
      className="absolute rounded-full bg-green-500 border-white dark:border-slate-800 box-content"
    />
  );
}
