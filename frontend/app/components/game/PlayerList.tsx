"use client";

import { ReactNode, useMemo } from "react";
import { useTranslations } from "next-intl";
import Avatar from "@/app/components/ui/Avatar";
import {
  GamePlayerView,
  GameRevealResult,
  GameScoreboardRow,
  GameVerdict,
} from "@/app/types/game";

function rankBadgeStyle(rank: number): string {
  if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600";
  if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-400";
  if (rank === 3) return "bg-gradient-to-r from-orange-400 to-orange-600";
  return "bg-gradient-to-r from-purple-600 to-blue-500";
}

export function AnswerBadge({
  answer,
  verdict,
}: {
  answer: string | null;
  verdict: GameVerdict | null;
}) {
  const t = useTranslations("game");
  const text = answer?.trim() ? answer : t("noAnswer");

  const style =
    verdict === 2
      ? "bg-green-100 text-green-700"
      : verdict === 1
        ? "bg-amber-100 text-amber-700"
        : verdict === 0
          ? "bg-red-100 text-red-600"
          : "bg-gray-100 text-gray-400";

  const icon =
    verdict === 2
      ? "fa-check"
      : verdict === 1
        ? "fa-circle-half-stroke"
        : verdict === 0
          ? "fa-xmark"
          : "fa-minus";

  return (
    <span
      title={text}
      className={`inline-flex items-center gap-1.5 max-w-full rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      <i className={`fas ${icon} shrink-0`}></i>
      <span className="truncate">{text}</span>
    </span>
  );
}

interface PlayerRowProps {
  fullName: string;
  userName: string;
  avatarUrl?: string;
  rank?: number;
  isHost?: boolean;
  connected?: boolean;
  highlight?: boolean;
  answer?: ReactNode;
  right?: ReactNode;
}

export function PlayerRow({
  fullName,
  userName,
  avatarUrl,
  rank,
  isHost,
  connected = true,
  highlight,
  answer,
  right,
}: PlayerRowProps) {
  const t = useTranslations("game");

  return (
    <div
      className={`flex items-center p-3 rounded-lg transition-colors ${
        highlight ? "bg-purple-50 border border-purple-200" : "bg-gray-50"
      } ${connected ? "" : "opacity-50"}`}
    >
      <div className="relative flex-shrink-0">
        <Avatar src={avatarUrl} name={fullName} size={44} />
        {rank !== undefined && (
          <div
            className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px] ${rankBadgeStyle(rank)}`}
          >
            #{rank}
          </div>
        )}
      </div>

      <div className="ml-4 min-w-0 flex-grow">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800 truncate">{fullName}</span>
          {isHost && (
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full shrink-0">
              {t("host")}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">@{userName}</span>
      </div>

      {answer && (
        <div className="min-w-0 max-w-[40%] mr-3 flex justify-end">{answer}</div>
      )}
      {!connected && (
        <span className="text-xs text-gray-400 mr-3 shrink-0">{t("offline")}</span>
      )}
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function LobbyPlayerList({
  players,
  currentUserId,
}: {
  players: GamePlayerView[];
  currentUserId: number | null;
}) {
  return (
    <div className="space-y-2">
      {players.map((player) => (
        <PlayerRow
          key={player.userId}
          fullName={player.fullName}
          userName={player.userName}
          avatarUrl={player.avatarUrl}
          isHost={player.isHost}
          connected={player.connected}
          highlight={player.userId === currentUserId}
        />
      ))}
    </div>
  );
}

export function Scoreboard({
  rows,
  currentUserId,
  results,
}: {
  rows: GameScoreboardRow[];
  currentUserId: number | null;
  results?: GameRevealResult[];
}) {
  const t = useTranslations("game");
  const resultByUser = useMemo(
    () => new Map((results ?? []).map((result) => [result.userId, result])),
    [results],
  );

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const result = resultByUser.get(row.userId);
        return (
          <PlayerRow
            key={row.userId}
            fullName={row.fullName}
            userName={row.userName}
            avatarUrl={row.avatarUrl}
            rank={row.rank}
            connected={row.connected}
            highlight={row.userId === currentUserId}
            answer={
              results ? (
                <AnswerBadge answer={result?.answer ?? null} verdict={result?.verdict ?? null} />
              ) : undefined
            }
            right={
              <div className="text-right">
                <div className="font-bold text-purple-600 text-lg leading-tight">
                  {row.score}
                  {result && result.points > 0 && (
                    <span className="ml-1 text-xs font-semibold text-green-600">
                      +{result.points}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {t("correctCount", { count: row.correct })}
                </div>
              </div>
            }
          />
        );
      })}
    </div>
  );
}
