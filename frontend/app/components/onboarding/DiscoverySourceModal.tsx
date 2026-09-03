"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { saveDiscoverySourceAction } from "@/app/(dashboard)/actions";

const OPTIONS = [
  { value: "friend", icon: "fa-user-group" },
  { value: "ai", icon: "fa-robot" },
  { value: "ads", icon: "fa-bullhorn" },
  { value: "youtube_comment", icon: "fa-comments" },
  { value: "social_media", icon: "fa-hashtag" },
  { value: "search_engine", icon: "fa-magnifying-glass" },
  { value: "other", icon: "fa-ellipsis" },
];

export default function DiscoverySourceModal() {
  const t = useTranslations("discovery");
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setMounted(true), []);

  const submit = (source: string) => {
    setSelected(source);
    startTransition(async () => {
      await saveDiscoverySourceAction(source);
      setOpen(false);
    });
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500" />
        <div className="p-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 text-white flex items-center justify-center mb-4 shadow-sm">
            <i className="fas fa-hand-sparkles"></i>
          </div>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            {t("title")}
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-5">{t("subtitle")}</p>

          <div className="flex flex-col gap-2">
            {OPTIONS.map((o) => {
              const isSelected = selected === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => submit(o.value)}
                  disabled={isPending}
                  className={`group flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all disabled:opacity-60 ${
                    isSelected
                      ? "border-transparent bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 text-white shadow-sm"
                      : "border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50"
                  }`}
                >
                  <i
                    className={`fas ${o.icon} w-4 text-center ${
                      isSelected
                        ? "text-white"
                        : "text-gray-400 group-hover:text-purple-500"
                    }`}
                  ></i>
                  <span>{t(`options.${o.value}`)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
