"use client";

import { RefObject } from "react";
import { useTranslations } from "next-intl";
import { LanguagePair } from "@/app/components/ui/Flags";
import { LobbyPlayerList, Scoreboard } from "@/app/components/game/PlayerList";
import {
  GameQuestionPayload,
  GameRevealPayload,
  GameRoomView,
  GameScoreboardRow,
  GameVerdict,
} from "@/app/types/game";

function verdictStyle(verdict: GameVerdict | null): string {
  if (verdict === 2) return "text-green-600";
  if (verdict === 1) return "text-amber-500";
  return "text-red-500";
}

export function LobbyStage({
  room,
  currentUserId,
  isHost,
  connectedCount,
  onStart,
  onLeave,
  onCopyLink,
}: {
  room: GameRoomView;
  currentUserId: number | null;
  isHost: boolean;
  connectedCount: number;
  onStart: () => void;
  onLeave: () => void;
  onCopyLink: () => void;
}) {
  const t = useTranslations("game");
  const canStart = isHost && connectedCount >= room.minPlayers;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">{room.groupName}</h1>
            <p className="text-sm text-blue-100 mt-1">
              {t("roomMeta", {
                players: room.players.length,
                max: room.maxPlayers,
                seconds: room.secondsPerQuestion,
                questions: room.questionCount,
              })}
            </p>
          </div>
          <LanguagePair languages={room.languages} className="text-blue-100 shrink-0" />
        </div>

        <button
          onClick={onCopyLink}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-sm hover:bg-white/30 transition cursor-pointer"
        >
          <i className="fas fa-link"></i>
          <span className="tracking-[0.2em] font-bold">{room.code}</span>
        </button>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            {t("playersTitle", { count: room.players.length })}
          </h2>
          <LobbyPlayerList players={room.players} currentUserId={currentUserId} />
        </div>

        <div className="flex gap-3">
          {isHost ? (
            <button
              onClick={onStart}
              disabled={!canStart}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-md font-medium transition disabled:opacity-50 cursor-pointer"
            >
              <i className="fas fa-play mr-1"></i>
              {canStart ? t("start") : t("needPlayers", { count: room.minPlayers })}
            </button>
          ) : (
            <div className="flex-1 text-center text-sm text-gray-500 py-2.5 bg-gray-50 rounded-md">
              <i className="fas fa-hourglass-half mr-1"></i> {t("waitingHost")}
            </div>
          )}
          <button
            onClick={onLeave}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-md font-medium transition cursor-pointer"
          >
            {t("leave")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CountdownStage({ remaining }: { remaining: number }) {
  const t = useTranslations("game");
  const value = Math.max(1, Math.ceil(remaining / 1000));

  return (
    <div className="bg-white rounded-lg shadow-lg p-12 text-center">
      <p className="text-gray-500 mb-4">{t("startingIn")}</p>
      <div className="text-7xl font-bold text-purple-600 tabular-nums">{value}</div>
    </div>
  );
}

export function QuestionStage({
  question,
  remaining,
  totalMs,
  answer,
  submitted,
  answeredCount,
  answeredTotal,
  inputRef,
  onChange,
  onSubmit,
}: {
  question: GameQuestionPayload;
  remaining: number;
  totalMs: number;
  answer: string;
  submitted: boolean;
  answeredCount: number;
  answeredTotal: number;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const t = useTranslations("game");
  const ratio = totalMs > 0 ? Math.max(0, Math.min(1, remaining / totalMs)) : 0;
  const urgent = ratio < 0.25;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="h-1.5 bg-gray-100">
        <div
          className={`h-full transition-[width] duration-100 ease-linear ${
            urgent ? "bg-red-500" : "bg-purple-600"
          }`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>

      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {t("questionCounter", { index: question.index + 1, total: question.total })}
          </span>
          <span className={`font-bold tabular-nums ${urgent ? "text-red-500" : "text-gray-700"}`}>
            {Math.max(0, Math.ceil(remaining / 1000))}
          </span>
        </div>

        <div className="text-center py-6">
          <span className="text-xs uppercase tracking-wide text-gray-400">
            {question.promptLang.toUpperCase()} → {question.answerLang.toUpperCase()}
          </span>
          <p className="text-3xl font-bold text-gray-800 mt-3 break-words">{question.prompt}</p>
        </div>

        <textarea
          ref={inputRef}
          value={answer}
          rows={question.isSentence ? 3 : 1}
          disabled={submitted}
          placeholder={t("answerPlaceholder")}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-md text-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-400"
        />

        <button
          onClick={onSubmit}
          disabled={submitted || !answer.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-md font-medium transition disabled:opacity-50 cursor-pointer"
        >
          {submitted ? t("answerSent") : t("send")}
        </button>

        <p className="text-center text-sm text-gray-500">
          {t("answeredCount", { answered: answeredCount, total: answeredTotal })}
        </p>
      </div>
    </div>
  );
}

export function RevealStage({
  reveal,
  currentUserId,
}: {
  reveal: GameRevealPayload;
  currentUserId: number | null;
}) {
  const t = useTranslations("game");
  const mine = reveal.results.find((result) => result.userId === currentUserId);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <p className="text-sm text-gray-500">{reveal.prompt}</p>
        <p className="text-2xl font-bold text-green-600 mt-2 break-words">
          {reveal.correctAnswers.join(" / ")}
        </p>

        {mine && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-1">{t("yourAnswer")}</p>
            <p className={`text-lg font-semibold break-words ${verdictStyle(mine.verdict)}`}>
              {mine.answer?.trim() ? mine.answer : t("noAnswer")}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {mine.verdict === 2
                ? t("verdictCorrect")
                : mine.verdict === 1
                  ? t("verdictClose")
                  : t("verdictWrong")}
              {mine.points > 0 && (
                <span className="font-bold text-purple-600 ml-2">+{mine.points}</span>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">{t("scoreboard")}</h2>
        <Scoreboard rows={reveal.scoreboard} currentUserId={currentUserId} />
      </div>
    </div>
  );
}

export function ResultsStage({
  ranking,
  currentUserId,
  onBack,
}: {
  ranking: GameScoreboardRow[];
  currentUserId: number | null;
  onBack: () => void;
}) {
  const t = useTranslations("game");
  const winner = ranking[0];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-8 text-center">
        <i className="fas fa-trophy text-4xl text-yellow-300"></i>
        <h1 className="text-2xl font-bold mt-3">{t("finished")}</h1>
        {winner && (
          <p className="text-blue-100 mt-1">
            {t("winner", { name: winner.fullName, score: winner.score })}
          </p>
        )}
      </div>

      <div className="p-6 space-y-5">
        <Scoreboard rows={ranking} currentUserId={currentUserId} />
        <button
          onClick={onBack}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-md font-medium transition cursor-pointer"
        >
          {t("backToGroups")}
        </button>
      </div>
    </div>
  );
}
