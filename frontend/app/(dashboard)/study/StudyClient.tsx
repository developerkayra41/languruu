"use client";

import Reveal from "@/app/components/ui/Reveal";
import { WordColumn } from "@/app/types/word";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { DEFAULT_MODE_ID, STUDY_MODES, getMode } from "./modes/registry";
import ModeSelector from "./modes/ModeSelector";

const MODE_KEY = "studyModeFamily";

interface StudyClientProps {
  group: WordColumn;
}

export default function StudyClient({ group }: StudyClientProps) {
  const t = useTranslations("study");
  const [modeId, setModeId] = useState<string>(DEFAULT_MODE_ID);

  const availableModes = useMemo(
    () => STUDY_MODES.filter((m) => m.isAvailable(group).ok),
    [group],
  );

  useEffect(() => {
    const stored = localStorage.getItem(MODE_KEY);
    if (!stored) return;
    if (availableModes.some((m) => m.id === stored)) setModeId(stored);
  }, [availableModes]);

  const changeMode = (id: string) => {
    setModeId(id);
    localStorage.setItem(MODE_KEY, id);
  };

  const activeMode = availableModes.some((m) => m.id === modeId)
    ? getMode(modeId)
    : getMode(DEFAULT_MODE_ID);
  const ActiveComponent = activeMode.Component;

  return (
    <Reveal>
      <div
        className="relative flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow-lg p-6 sm:p-8"
        onClick={(e) => {
          const el = e.target as HTMLElement;
          if (el.closest("input, button, a, textarea, [role=button]")) return;
          (document.activeElement as HTMLElement | null)?.blur();
        }}
      >
        <div className="text-center mb-4 px-8 w-full">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">
            {group.name}
          </h2>
          <p className="text-gray-600 mt-1">
            {t("wordCount", { count: group.wordPool.length })}
          </p>
        </div>

        <ModeSelector
          modes={availableModes}
          activeId={activeMode.id}
          onChange={changeMode}
        />

        <ActiveComponent key={activeMode.id} group={group} />
      </div>
    </Reveal>
  );
}
