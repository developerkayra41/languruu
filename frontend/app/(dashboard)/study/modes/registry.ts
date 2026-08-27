import ClassicMode from "./classic/ClassicMode";
import SentenceMode, { buildSentenceItems } from "./sentence/SentenceMode";
import { SENTENCE_MODE_ENABLED } from "@/app/lib/features";
import { StudyModeDef, StudyModeId } from "./types";

export const STUDY_MODES: StudyModeDef[] = [
  {
    id: "classic",
    labelKey: "modeClassic",
    icon: "fa-layer-group",
    isAvailable: () => ({ ok: true }),
    Component: ClassicMode,
  },
  ...(SENTENCE_MODE_ENABLED
    ? [
        {
          id: "sentence" as StudyModeId,
          labelKey: "modeSentence",
          icon: "fa-quote-right",
          isAvailable: (group) =>
            buildSentenceItems(group).length > 0
              ? ({ ok: true } as const)
              : ({ ok: false, reasonKey: "modeSentenceEmpty" } as const),
          Component: SentenceMode,
        } satisfies StudyModeDef,
      ]
    : []),
];

export const DEFAULT_MODE_ID: StudyModeId = "classic";

export function getMode(id: string): StudyModeDef {
  return (
    STUDY_MODES.find((m) => m.id === id) ??
    STUDY_MODES.find((m) => m.id === DEFAULT_MODE_ID)!
  );
}
