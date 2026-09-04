"use client";

import { WordColumn, WordExample } from "@/app/types/word";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { recordStudyCompleteAction } from "../../actions";
import NoteTooltip from "@/app/components/ui/NoteTooltip";
import { pickRandom, shuffle, speak } from "../shared/study-utils";
import {
  buildItemKeys,
  loadProgress,
  saveProgress,
} from "../shared/study-progress";
import { StudyModeProps } from "../types";
import { useXpAwarder } from "../shared/use-xp";

interface SentenceItem {
  id: number;
  terms: string[];
  translations: string[];
  note?: string;
  example: WordExample;
}

type Direction = "term-to-translation" | "translation-to-term";
type StudyDirection = 1 | 2 | 3;
type Step = "word" | "sentence";

const STUDY_MODE_KEY = "studyMode";
const SPEAK_KEY = "studySpeak";
const MODE_ID = "sentence";

export function buildSentenceItems(group: WordColumn): SentenceItem[] {
  return group.wordPool.flatMap((pool, index) => {
    const example = pool.examples?.find(
      (e) => e.text?.trim() && e.translation?.trim(),
    );
    if (!example) return [];
    return [
      {
        id: index,
        terms: pool.term,
        translations: pool.translation,
        note: pool.note,
        example,
      },
    ];
  });
}

function isValidDirection(value: number): value is StudyDirection {
  return value === 1 || value === 2 || value === 3;
}

export default function SentenceMode({ group }: StudyModeProps) {
  const t = useTranslations("study");
  const [currentGroup] = useState<WordColumn>(group);
  const items = useMemo(() => buildSentenceItems(currentGroup), [currentGroup]);
  const itemKeys = useMemo(() => buildItemKeys(items), [items]);

  const { awardWord } = useXpAwarder();

  const [mode, setMode] = useState<StudyDirection>(3);
  const [speakEnabled, setSpeakEnabled] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  const confettiRef = useRef<InstanceType<
    typeof import("js-confetti").default
  > | null>(null);

  useEffect(() => {
    let mounted = true;
    import("js-confetti").then(({ default: JSConfetti }) => {
      if (mounted) confettiRef.current = new JSConfetti();
    });

    const stored = Number(localStorage.getItem(STUDY_MODE_KEY));
    if (isValidDirection(stored)) setMode(stored);
    if (localStorage.getItem(SPEAK_KEY) === "1") setSpeakEnabled(true);
    setHasHydrated(true);

    return () => {
      mounted = false;
    };
  }, []);

  const changeMode = (newMode: StudyDirection) => {
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
    shuffle(items.map((_, i) => i)),
  );
  const [pointer, setPointer] = useState(0);
  const [step, setStep] = useState<Step>("word");
  const [revealed, setRevealed] = useState(false);
  const [usedWordReveal, setUsedWordReveal] = useState(false);
  const [roundCompleted, setRoundCompleted] = useState(false);

  const currentItem = items[queue[pointer]];

  useEffect(() => {
    const restored = loadProgress(currentGroup.id, MODE_ID, itemKeys);
    if (!restored) return;
    setQueue(restored.queue);
    setPointer(restored.pointer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    saveProgress(currentGroup.id, MODE_ID, itemKeys, queue, pointer);
  }, [hasHydrated, currentGroup.id, itemKeys, queue, pointer]);

  const direction = useMemo<Direction>(() => {
    if (mode === 1) return "term-to-translation";
    if (mode === 2) return "translation-to-term";
    return Math.random() < 0.5 ? "term-to-translation" : "translation-to-term";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pointer]);

  const displayWord = useMemo(() => {
    if (!currentItem) return "";
    return direction === "term-to-translation"
      ? pickRandom(currentItem.terms)
      : pickRandom(currentItem.translations);
  }, [currentItem, direction]);

  const termLang = currentGroup.languages?.[0];
  const translationLang = currentGroup.languages?.[1];
  const questionLang =
    direction === "term-to-translation" ? termLang : translationLang;
  const answerLang =
    direction === "term-to-translation" ? translationLang : termLang;

  const sentenceQuestion =
    direction === "term-to-translation"
      ? currentItem?.example.text
      : currentItem?.example.translation;
  const sentenceAnswer =
    direction === "term-to-translation"
      ? currentItem?.example.translation
      : currentItem?.example.text;

  const acceptableAnswers = useMemo(() => {
    if (!currentItem) return [];
    const source =
      direction === "term-to-translation"
        ? currentItem.translations
        : currentItem.terms;
    return source.map((w) => w.toLocaleLowerCase().trim());
  }, [currentItem, direction]);

  const [userAnswer, setUserAnswer] = useState("");
  const [sentenceInput, setSentenceInput] = useState("");
  const answerInputRef = useRef<HTMLTextAreaElement>(null);
  const sentenceInputRef = useRef<HTMLTextAreaElement>(null);
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

  useEffect(() => {
    const el = sentenceInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [sentenceInput, step]);

  const stepChangedRef = useRef(false);

  useEffect(() => {
    if (!stepChangedRef.current) {
      stepChangedRef.current = true;
      return;
    }
    if (step === "sentence") sentenceInputRef.current?.focus();
    else answerInputRef.current?.focus();
  }, [step, pointer]);

  useEffect(() => {
    if (!speakEnabled) return;
    if (step === "word" && displayWord) speak(displayWord, questionLang);
    if (step === "sentence" && sentenceQuestion)
      speak(sentenceQuestion, questionLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, displayWord, sentenceQuestion, speakEnabled]);

  useEffect(() => {
    if (step !== "sentence" || !revealed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finishItem(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        finishItem(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, revealed, pointer, queue]);

  const showInfo = (isCorrect: boolean, result: string) => {
    setFeedback({
      visible: true,
      color: isCorrect ? "#0D7918" : "#ff0000",
      text: result,
    });
    setTimeout(() => setFeedback((prev) => ({ ...prev, visible: false })), 1000);
    setTimeout(
      () => setFeedback({ visible: false, color: "#0D7918", text: "" }),
      1300,
    );
  };

  const finishItem = (knewIt: boolean) => {
    showInfo(knewIt, knewIt ? t("correct") : t("wrong"));
    setRevealed(false);
    setUsedWordReveal(false);
    setStep("word");
    setUserAnswer("");
    setSentenceInput("");

    const isLast = pointer + 1 >= queue.length;

    if (!knewIt) {
      setQueue((prev) => [...prev, queue[pointer]]);
      setPointer((p) => p + 1);
      return;
    }

    if (isLast) {
      confettiRef.current?.addConfetti();
      setRoundCompleted(true);
      setTimeout(() => setRoundCompleted(false), 2500);
      void recordStudyCompleteAction();

      let reshuffled = shuffle(items.map((_, i) => i));
      if (reshuffled[0] === queue[pointer] && reshuffled.length > 1) {
        [reshuffled[0], reshuffled[1]] = [reshuffled[1], reshuffled[0]];
      }
      setQueue(reshuffled);
      setPointer(0);
      return;
    }

    setPointer((p) => p + 1);
  };

  const checkAnswer = () => {
    if (!currentItem) return;
    const normalized = userAnswer.trim().toLocaleLowerCase();
    const isCorrect = acceptableAnswers.includes(normalized);

    showInfo(isCorrect, isCorrect ? t("correct") : t("wrong"));

    if (isCorrect) {
      if (!usedWordReveal) awardWord(itemKeys[queue[pointer]]);
      setUserAnswer("");
      setStep("sentence");
    }
    answerInputRef.current?.focus();
  };

  const revealAnswer = () => {
    if (!currentItem) return;
    const source =
      direction === "term-to-translation"
        ? currentItem.translations
        : currentItem.terms;
    setUsedWordReveal(true);
    setUserAnswer(pickRandom(source));
  };

  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[280px]">
        <div className="animate-pulse text-gray-300 text-lg">{t("loading")}</div>
      </div>
    );
  }

  if (!currentItem) return null;

  return (
    <>
      <button
        type="button"
        onClick={toggleSpeak}
        title={t("speak")}
        aria-label={t("speak")}
        className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors z-10 ${
          speakEnabled
            ? "bg-purple-100 text-purple-600"
            : "text-gray-400 hover:bg-gray-100"
        }`}
      >
        <i
          className={`fas ${speakEnabled ? "fa-volume-high" : "fa-volume-xmark"}`}
        ></i>
      </button>

      <div className="flex bg-gray-100 rounded-full p-1 mb-4">
        {[
          {
            value: 1 as StudyDirection,
            label: `${termLang?.toUpperCase()} → ${translationLang?.toUpperCase()}`,
          },
          {
            value: 2 as StudyDirection,
            label: `${translationLang?.toUpperCase()} → ${termLang?.toUpperCase()}`,
          },
          { value: 3 as StudyDirection, label: t("mixed") },
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

      <div className="flex items-center gap-2 mb-4 text-xs font-medium">
        <span
          className={`px-2.5 py-1 rounded-full ${
            step === "word"
              ? "bg-purple-100 text-purple-700"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          1. {t("stepWord")}
        </span>
        <i className="fas fa-arrow-right text-gray-300 text-[0.6rem]"></i>
        <span
          className={`px-2.5 py-1 rounded-full ${
            step === "sentence"
              ? "bg-purple-100 text-purple-700"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          2. {t("stepSentence")}
        </span>
      </div>

      {step === "word" ? (
        <>
          <div className="w-full text-4xl font-bold text-center break-words mb-0">
            {displayWord}
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
                className={`w-full py-3 text-lg border rounded-3xl focus:outline-none focus:ring-2 text-center transition-colors resize-none overflow-hidden block leading-7 pr-12 ${
                  currentItem.note ? "pl-12" : "pl-6"
                }`}
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
              {currentItem.note && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
                  <NoteTooltip
                    key={currentItem.id}
                    note={currentItem.note}
                    size="md"
                  />
                </span>
              )}
              <button
                type="button"
                onClick={revealAnswer}
                title={t("showAnswer")}
                aria-label={t("showAnswer")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full text-purple-500 hover:text-purple-700 hover:bg-purple-50 text-xl font-bold transition-colors"
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
        </>
      ) : (
        <div className="w-full max-w-xl">
          <p className="text-center text-sm text-gray-500 mb-3">
            {t("sentencePrompt")}
          </p>

          <div className="rounded-2xl border border-purple-100 bg-purple-50 px-5 py-4 text-center">
            <p className="text-xl sm:text-2xl font-semibold text-gray-800 break-words leading-snug">
              {sentenceQuestion}
            </p>
            {speakEnabled && sentenceQuestion && (
              <button
                type="button"
                onClick={() => speak(sentenceQuestion, questionLang)}
                title={t("replay")}
                aria-label={t("replay")}
                className="mt-2 text-purple-400 hover:text-purple-600"
              >
                <i className="fas fa-volume-high"></i>
              </button>
            )}
          </div>

          <div className="mt-3">
            <textarea
              ref={sentenceInputRef}
              rows={1}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              readOnly={revealed}
              placeholder={t("sentenceAnswerPlaceholder")}
              value={sentenceInput}
              onChange={(e) => setSentenceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  if (revealed) finishItem(true);
                  else setRevealed(true);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  e.stopPropagation();
                  if (revealed) finishItem(false);
                }
              }}
              className={`w-full px-5 py-3 text-lg border rounded-3xl focus:outline-none focus:ring-2 text-center transition-colors resize-none overflow-hidden block leading-7 ${
                revealed ? "opacity-70" : ""
              }`}
            />
          </div>

          {revealed ? (
            <>
              <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-center">
                <p className="text-xs text-gray-400 mb-1">
                  {t("correctSentence")}
                </p>
                <p className="text-lg text-gray-700 break-words leading-snug">
                  {sentenceAnswer}
                </p>
                {speakEnabled && sentenceAnswer && (
                  <button
                    type="button"
                    onClick={() => speak(sentenceAnswer, answerLang)}
                    title={t("replay")}
                    aria-label={t("replay")}
                    className="mt-2 text-purple-400 hover:text-purple-600"
                  >
                    <i className="fas fa-volume-high"></i>
                  </button>
                )}
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => finishItem(false)}
                  className="flex-1 border border-gray-200 text-gray-600 px-4 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <i className="fas fa-rotate-left text-sm mr-2"></i>
                  {t("didntKnow")}
                </button>
                <button
                  onClick={() => finishItem(true)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-500 text-white px-4 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-95 cursor-pointer"
                >
                  <i className="fas fa-check text-sm mr-2"></i>
                  {t("knewIt")}
                </button>
              </div>

              <p className="mt-2 text-center text-[0.7rem] text-gray-400 hidden sm:block">
                {t("shortcutHint")}
              </p>
            </>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-95 cursor-pointer"
            >
              {t("showSentenceAnswer")}
            </button>
          )}

          <div className="h-6 flex items-center justify-center mt-2">
            {roundCompleted && (
              <p className="text-purple-600 font-semibold text-[1.05rem] animate-pulse">
                {t("completed")}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
