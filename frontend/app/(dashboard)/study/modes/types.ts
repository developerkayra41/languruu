import { ComponentType } from "react";
import { WordColumn } from "@/app/types/word";

export type StudyModeId = "classic" | "sentence";

export interface StudyModeProps {
  group: WordColumn;
}

export type StudyModeAvailability =
  | { ok: true }
  | { ok: false; reasonKey: string };

export interface StudyModeDef {
  id: StudyModeId;
  labelKey: string;
  icon: string;
  isAvailable: (group: WordColumn) => StudyModeAvailability;
  Component: ComponentType<StudyModeProps>;
}
