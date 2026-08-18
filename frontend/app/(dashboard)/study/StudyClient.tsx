"use client";

import Reveal from "@/app/components/ui/Reveal";
import { WordColumn } from "@/app/types/word";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { recordStudyCompleteAction } from "./actions";
import NoteTooltip from "@/app/components/ui/NoteTooltip";

interface QuizItem {
  id: number;
  terms: string[];
  translations: string[];
  note?: string;
}

type Direction = "term-to-translation" | "translation-to-term";
type StudyMode = 1 | 2 | 3;

const STUDY_MODE_KEY = "studyMode";
const SPEAK_KEY = "studySpeak";

const LANG_TO_BCP: Record<string, string> = {
  en: "en-GB", tr: "tr-TR", de: "de-DE", fr: "fr-FR", es: "es-ES",
  it: "it-IT", ru: "ru-RU", ar: "ar-SA", zh: "zh-CN", ja: "ja-JP",
  ko: "ko-KR", pt: "pt-PT", nl: "nl-NL",
};

function speak(text: string, langCode?: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
  const bcp = (langCode && LANG_TO_BCP[langCode]) || langCode || "";
  const u = new SpeechSynthesisUtterance(text);
  if (bcp) u.lang = bcp;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length && bcp) {
    const base = bcp.split("-")[0];
    const voice =
      voices.find((v) => v.lang === bcp) ??
      voices.find((v) => v.lang.startsWith(base));
    if (voice) u.voice = voice;
  }
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function buildQuizItems(group: WordColumn): QuizItem[] {
  return group.wordPool.map((pool, index) => ({
    id: index,
    terms: pool.term,
    translations: pool.translation,
    note: pool.note,
  }));
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function isValidMode(value: number): value is StudyMode {
  return value === 1 || value === 2 || value === 3;
}

interface StudyClientProps {
  group: WordColumn;
}

export default function StudyClient({ group }: StudyClientProps) {
  const t = useTranslations("study");
  const [currentGroup] = useState<WordColumn>(group);
  const quizItems = useMemo(() => buildQuizItems(currentGroup), [currentGroup]);

  const [mode, setMode] = useState<StudyMode>(3);
  const [speakEnabled, setSpeakEnabled] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  const confettiRef = useRef<InstanceType<
    typeof import("js-confetti").default
  > | null>(null);

  useEffect(() => {
    let mounted = true;
    import("js-confetti").then(({ default: JSConfetti }) => {
      if (mounted) {
        confettiRef.current = new JSConfetti();
      }
    });

    const stored = Number(localStorage.getItem(STUDY_MODE_KEY));
    if (isValidMode(stored)) {
      setMode(stored);
    }
    if (localStorage.getItem(SPEAK_KEY) === "1") setSpeakEnabled(true);
    setHasHydrated(true);

    return () => {
      mounted = false;
    };
  }, []);

  const changeMode = (newMode: StudyMode) => {
    setMode(newMode);
    localStorage.setItem(STUDY_MODE_KEY, String(newMode));
  };

  const toggleSpeak = () => {
    setSpeakEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(SPEAK_KEY, next ? "1" : "0");
      if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  };

  const [queue, setQueue] = useState<number[]>(() =>
    shuffle(quizItems.map((_, i) => i)),
  );
  const [pointer, setPointer] = useState(0);
  const currentItem = quizItems[queue[pointer]];

  const [roundCompleted, setRoundCompleted] = useState(false);

  const goToNextQuestion = () => {
    if (pointer + 1 >= queue.length) {
      confettiRef.current?.addConfetti();
      setRoundCompleted(true);
      setTimeout(() => setRoundCompleted(false), 2500);
      void recordStudyCompleteAction();

      let reshuffled = shuffle(quizItems.map((_, i) => i));
      if (reshuffled[0] === queue[pointer] && reshuffled.length > 1) {
        [reshuffled[0], reshuffled[1]] = [reshuffled[1], reshuffled[0]];
      }
      setQueue(reshuffled);
      setPointer(0);
    } else {
      setPointer((p) => p + 1);
    }
  };

  const autoQuestion = useMemo(() => {
    if (!currentItem) return null;
    const dir: Direction =
      mode === 1
        ? "term-to-translation"
        : mode === 2
          ? "translation-to-term"
          : Math.random() < 0.5
            ? "term-to-translation"
            : "translation-to-term";
    return {
      direction: dir,
      displayWord:
        dir === "term-to-translation"
          ? pickRandom(currentItem.terms)
          : pickRandom(currentItem.translations),
    };
  }, [currentItem, mode]);

  const [manualOverride, setManualOverride] = useState<{
    direction: Direction;
    displayWord: string;
  } | null>(null);

  useEffect(() => {
    setManualOverride(null);
  }, [currentItem]);

  const activeQuestion = manualOverride ?? autoQuestion;

  const displayLang =
    activeQuestion?.direction === "term-to-translation"
      ? currentGroup.languages?.[0]
      : currentGroup.languages?.[1];

  useEffect(() => {
    if (speakEnabled && activeQuestion) {
      speak(activeQuestion.displayWord, displayLang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuestion?.displayWord, speakEnabled]);

  const replaySpeak = () => {
    if (activeQuestion) speak(activeQuestion.displayWord, displayLang);
  };

  const handleSwapDirection = () => {
    if (!currentItem || !activeQuestion) return;
    const newDirection: Direction =
      activeQuestion.direction === "term-to-translation"
        ? "translation-to-term"
        : "term-to-translation";

    setManualOverride({
      direction: newDirection,
      displayWord:
        newDirection === "term-to-translation"
          ? pickRandom(currentItem.terms)
          : pickRandom(currentItem.translations),
    });
    setUserAnswer("");
  };

  const acceptableAnswers = useMemo(() => {
    if (!currentItem || !activeQuestion) return [];
    const source =
      activeQuestion.direction === "term-to-translation"
        ? currentItem.translations
        : currentItem.terms;
    return source.map((w) => w.toLocaleLowerCase().trim());
  }, [currentItem, activeQuestion]);

  const [userAnswer, setUserAnswer] = useState("");
  const answerInputRef = useRef<HTMLTextAreaElement>(null);
  const [feedback, setFeedback] = useState<{
    visible: boolean;
    color: string;
    text: string;
  }>({ visible: false, color: "#0D7918", text: "" });

  useEffect(() => {
    const el = answerInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [userAnswer]);

  const showInfo = (isCorrect: boolean, result: string) => {
    setFeedback({
      visible: true,
      color: isCorrect ? "#0D7918" : "#ff0000",
      text: result,
    });
    setTimeout(
      () => setFeedback((prev) => ({ ...prev, visible: false })),
      1000,
    );
    setTimeout(
      () => setFeedback({ visible: false, color: "#0D7918", text: "" }),
      1300,
    );
  };

  const checkAnswer = () => {
    if (!currentItem) return;
    const normalized = userAnswer.trim().toLocaleLowerCase();
    const isCorrect = acceptableAnswers.includes(normalized);

    showInfo(isCorrect, isCorrect ? t("correct") : t("wrong"));

    if (isCorrect) {
      setUserAnswer("");
      goToNextQuestion();
    }
    answerInputRef.current?.focus();
  };

  const revealAnswer = () => {
    if (!currentItem || !activeQuestion) return;
    const source =
      activeQuestion.direction === "term-to-translation"
        ? currentItem.translations
        : currentItem.terms;
    setUserAnswer(pickRandom(source));
  };

  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white rounded-lg shadow-lg p-8">
        <div className="animate-pulse text-gray-300 text-lg">{t("loading")}</div>
      </div>
    );
  }

  if (!currentItem || !activeQuestion) return null;

  return (
    <Reveal>
      <div
        className="relative flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow-lg p-8"
        onClick={(e) => {
          const el = e.target as HTMLElement;
          if (el.closest("input, button, a, textarea, [role=button]")) return;
          answerInputRef.current?.blur();
        }}
      >
        <button
          type="button"
          onClick={toggleSpeak}
          title={t("speak")}
          aria-label={t("speak")}
          className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            speakEnabled
              ? "bg-purple-100 text-purple-600"
              : "text-gray-400 hover:bg-gray-100"
          }`}
        >
          <i
            className={`fas ${speakEnabled ? "fa-volume-high" : "fa-volume-xmark"}`}
          ></i>
        </button>

        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {currentGroup.name}
          </h2>
          <p className="text-gray-600 mt-1">
            {t("wordCount", { count: currentGroup.wordPool.length })}
          </p>
        </div>

        <div className="flex bg-gray-100 rounded-full p-1 mb-6">
          {[
            {
              value: 1 as StudyMode,
              label: `${currentGroup.languages?.[0].toUpperCase()} → ${currentGroup.languages?.[1].toUpperCase()}`,
            },
            {
              value: 2 as StudyMode,
              label: `${currentGroup.languages?.[1].toUpperCase()} → ${currentGroup.languages?.[0].toUpperCase()}`,
            },
            { value: 3 as StudyMode, label: t("mixed") },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => changeMode(option.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                mode === option.value
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-0">
          <div className="text-4xl font-bold">{activeQuestion.displayWord}</div>
          {speakEnabled && (
            <button
              type="button"
              onClick={replaySpeak}
              title={t("replay")}
              aria-label={t("replay")}
              className="text-purple-400 hover:text-purple-600 text-xl"
            >
              <i className="fas fa-volume-high"></i>
            </button>
          )}
          {currentItem.note && (
            <NoteTooltip key={currentItem.id} note={currentItem.note} size="md" />
          )}
        </div>
        <div className="h-6 flex items-center justify-center mb-1">
          {roundCompleted ? (
            <p className="text-purple-600 font-semibold text-[1.05rem] animate-pulse">
              {t("completed")}
            </p>
          ) : (
            <p
              className="text-[1.05rem]"
              style={{
                color: feedback.color,
                opacity: feedback.visible ? 1 : 0,
                transition: "opacity 300ms",
              }}
            >
              {feedback.text}
            </p>
          )}
        </div>

        <div
          className={`w-full transition-all duration-300 ${
            userAnswer.length > 30 ? "max-w-2xl" : "max-w-md"
          }`}
        >
          <div className="relative">
            <textarea
              ref={answerInputRef}
              rows={1}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              className="w-full px-6 py-3 pr-12 text-lg border rounded-3xl focus:outline-none focus:ring-2 text-center transition-colors resize-none overflow-hidden block leading-7"
              placeholder={t("answerPlaceholder")}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  checkAnswer();
                }
              }}
            />
            <button
              type="button"
              onClick={revealAnswer}
              title={t("showAnswer")}
              aria-label={t("showAnswer")}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-purple-500 hover:text-purple-700 text-xl font-bold"
            >
              ?
            </button>
          </div>
          <button
            onClick={checkAnswer}
            className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-95"
          >
            {t("check")}
          </button>
        </div>
      </div>
    </Reveal>
  );
}
