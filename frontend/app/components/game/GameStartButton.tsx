"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { addGroupForGame, fetchGameRooms } from "@/app/(dashboard)/game/actions";
import { GameActionError, GameDirection, GameRoomSummary, GameSeconds } from "@/app/types/game";

const SECONDS: GameSeconds[] = [10, 20, 30];

interface GameStartButtonProps {
  shareId?: string | null;
  languages?: string[];
  groupName: string;
}

export default function GameStartButton({ shareId, languages, groupName }: GameStartButtonProps) {
  const t = useTranslations("game");
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [rooms, setRooms] = useState<GameRoomSummary[]>([]);
  const [loadError, setLoadError] = useState<GameActionError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [seconds, setSeconds] = useState<GameSeconds>(20);
  const [direction, setDirection] = useState<GameDirection>(3);

  const load = useCallback(() => {
    if (!shareId) return;
    setIsLoading(true);
    setLoadError(null);
    fetchGameRooms(shareId)
      .then((result) => {
        if (result.success) setRooms(result.rooms);
        else setLoadError(result.error);
      })
      .finally(() => setIsLoading(false));
  }, [shareId]);

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (isOpen && shareId) load();
  }, [isOpen, shareId, load]);

  const handleAdd = () => {
    if (!shareId) return;
    startTransition(async () => {
      const result = await addGroupForGame(shareId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t("groupAdded"));
      load();
    });
  };

  const directionLabels: { value: GameDirection; label: string }[] = [
    { value: 1, label: `${(languages?.[0] ?? "").toUpperCase()} → ${(languages?.[1] ?? "").toUpperCase()}` },
    { value: 2, label: `${(languages?.[1] ?? "").toUpperCase()} → ${(languages?.[0] ?? "").toUpperCase()}` },
    { value: 3, label: t("mixed") },
  ];

  return (
    <>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-full border border-white/70 bg-white/20 text-white text-xs font-medium px-4 py-1.5 backdrop-blur-sm hover:bg-white/30 transition cursor-pointer"
        >
          <i className="fas fa-gamepad mr-1"></i> {t("startGame")}
        </button>
      </div>

      {isOpen && isMounted && createPortal(
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-start p-6 pb-4">
              <div className="min-w-0">
                <h3 className="text-xl font-semibold text-gray-800 truncate">{groupName}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{t("roomsSubtitle")}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer ml-4"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="px-6 pb-6 space-y-5">
              {!shareId ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mx-auto mb-3">
                    <i className="fas fa-globe"></i>
                  </div>
                  <p className="text-gray-600 text-sm">{t("notShared")}</p>
                </div>
              ) : loadError?.code === "GROUP_NOT_OWNED" ? (
                <div className="text-center py-6">
                  <p className="text-gray-600 text-sm mb-4">{t("notOwned")}</p>
                  <button
                    onClick={handleAdd}
                    disabled={isPending}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition disabled:opacity-50 cursor-pointer"
                  >
                    <i className="fas fa-book-reader mr-1"></i>
                    {isPending ? t("adding") : t("addAndJoin")}
                  </button>
                </div>
              ) : loadError ? (
                <div className="text-center py-6">
                  <p className="text-gray-600 text-sm">
                    {t.has(`errors.${loadError.code}`)
                      ? t(`errors.${loadError.code}`)
                      : t("errors.GAME_ERROR")}
                  </p>
                  {loadError.code === "GAME_ERROR" && loadError.detail !== "GAME_ERROR" && (
                    <p className="text-xs text-gray-400 mt-2 break-words">{loadError.detail}</p>
                  )}
                  <button
                    onClick={load}
                    className="text-purple-600 hover:underline text-sm font-medium cursor-pointer mt-4"
                  >
                    {t("retry")}
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-700 text-sm">{t("openRooms")}</h4>
                      <button
                        onClick={load}
                        className="text-xs text-gray-400 hover:text-purple-600 cursor-pointer"
                      >
                        <i className="fas fa-rotate-right mr-1"></i>
                        {t("refresh")}
                      </button>
                    </div>

                    {isLoading ? (
                      <div className="text-center py-6 text-gray-400 text-sm animate-pulse">
                        {t("loading")}
                      </div>
                    ) : rooms.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-lg">
                        {t("noRooms")}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {rooms.map((room) => (
                          <div
                            key={room.code}
                            className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg p-3"
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-gray-800 text-sm truncate">
                                {t("hostedBy", { name: room.hostFullName })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {t("roomMeta", {
                                  players: room.playerCount,
                                  max: room.maxPlayers,
                                  seconds: room.secondsPerQuestion,
                                  questions: room.questionCount,
                                })}
                              </div>
                            </div>
                            <button
                              onClick={() => router.push(`/game/${room.code}`)}
                              disabled={room.playerCount >= room.maxPlayers}
                              className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1.5 rounded-md text-sm font-medium transition shrink-0 disabled:opacity-40 cursor-pointer"
                            >
                              {room.playerCount >= room.maxPlayers ? t("full") : t("join")}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-5 space-y-4">
                    <h4 className="font-medium text-gray-700 text-sm">{t("createRoom")}</h4>

                    <div>
                      <label className="block text-xs text-gray-500 mb-2">{t("secondsLabel")}</label>
                      <div className="flex bg-gray-100 rounded-full p-1">
                        {SECONDS.map((value) => (
                          <button
                            key={value}
                            onClick={() => setSeconds(value)}
                            className={`flex-1 py-1.5 rounded-full text-sm font-medium transition cursor-pointer ${
                              seconds === value
                                ? "bg-purple-600 text-white"
                                : "text-gray-600 hover:text-purple-600"
                            }`}
                          >
                            {t("secondsValue", { seconds: value })}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-2">{t("directionLabel")}</label>
                      <div className="flex bg-gray-100 rounded-full p-1">
                        {directionLabels.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setDirection(option.value)}
                            className={`flex-1 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                              direction === option.value
                                ? "bg-purple-600 text-white"
                                : "text-gray-600 hover:text-purple-600"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        router.push(
                          `/game/new?share=${encodeURIComponent(shareId)}&seconds=${seconds}&direction=${direction}`,
                        )
                      }
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-md text-sm font-medium transition cursor-pointer"
                    >
                      <i className="fas fa-plus mr-1"></i> {t("createRoom")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
