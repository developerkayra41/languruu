"use client";

import { useTranslations } from "next-intl";
import { StudyModeDef } from "./types";

interface ModeSelectorProps {
  modes: StudyModeDef[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function ModeSelector({
  modes,
  activeId,
  onChange,
}: ModeSelectorProps) {
  const t = useTranslations("study");

  if (modes.length < 2) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
      {modes.map((mode) => {
        const isActive = mode.id === activeId;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            aria-pressed={isActive}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${
              isActive
                ? "border-purple-500 bg-purple-50 text-purple-700"
                : "border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <i className={`fas ${mode.icon} text-xs`}></i>
            {t(mode.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
