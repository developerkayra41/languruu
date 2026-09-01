"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import Avatar from "@/app/components/ui/Avatar";
import { GamePlayerView, GameScoreboardRow } from "@/app/types/game";

function rankBadgeStyle(rank: number): string {
  if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600";
  if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-400";
  if (rank === 3) return "bg-gradient-to-r from-orange-400 to-orange-600";
  return "bg-gradient-to-r from-purple-600 to-blue-500";
}

interface PlayerRowProps {
  fullName: string;
  userName: string;
  avatarUrl?: string;
  rank?: number;
  isHost?: boolean;
  connected?: boolean;
  highlight?: boolean;
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
}: {
  rows: GameScoreboardRow[];
  currentUserId: number | null;
}) {
  const t = useTranslations("game");

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <PlayerRow
          key={row.userId}
          fullName={row.fullName}
          userName={row.userName}
          avatarUrl={row.avatarUrl}
          rank={row.rank}
          connected={row.connected}
          highlight={row.userId === currentUserId}
          right={
            <div className="text-right">
              <div className="font-bold text-purple-600 text-lg leading-tight">{row.score}</div>
              <div className="text-xs text-gray-500">
                {t("correctCount", { count: row.correct })}
              </div>
            </div>
          }
        />
      ))}
    </div>
  );
}
