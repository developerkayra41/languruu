"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";
import { createGameSocket } from "@/app/lib/game-socket";
import {
  CountdownStage,
  LobbyStage,
  QuestionStage,
  RevealStage,
  ResultsStage,
} from "@/app/components/game/Stages";
import {
  GameDirection,
  GameFinishedPayload,
  GameQuestionPayload,
  GameRevealPayload,
  GameRoomView,
  GameSeconds,
  GameXpPayload,
  GameXpResult,
} from "@/app/types/game";

const FATAL_CODES = new Set([
  "ROOM_NOT_FOUND",
  "ROOM_FULL",
  "ROOM_ALREADY_STARTED",
  "GROUP_NOT_OWNED",
  "SHARE_NOT_FOUND",
  "GROUP_TOO_SMALL",
  "INVALID_TICKET",
  "TICKET_ALREADY_USED",
  "ACCOUNT_SUSPENDED",
]);

interface GameRoomClientProps {
  code: string;
  createShareId: string | null;
  seconds: GameSeconds;
  direction: GameDirection;
}

export default function GameRoomClient({
  code,
  createShareId,
  seconds,
  direction,
}: GameRoomClientProps) {
  const t = useTranslations("game");
  const router = useRouter();

  const socketRef = useRef<Socket | null>(null);
  const offsetRef = useRef(0);
  const roomRef = useRef<GameRoomView | null>(null);
  const targetCodeRef = useRef<string | null>(createShareId ? null : code);
  const confettiRef = useRef<InstanceType<typeof import("js-confetti").default> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const userIdRef = useRef<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<GameRoomView | null>(null);
  const [countdownAt, setCountdownAt] = useState<number | null>(null);
  const [question, setQuestion] = useState<GameQuestionPayload | null>(null);
  const [reveal, setReveal] = useState<GameRevealPayload | null>(null);
  const [finished, setFinished] = useState<GameFinishedPayload | null>(null);
  const [xpResult, setXpResult] = useState<GameXpResult | null>(null);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [answeredCount, setAnsweredCount] = useState({ answered: 0, total: 0 });
  const [, setTick] = useState(0);

  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);
  const translate = useCallback(
    (key: string) => (t.has(key) ? t(key) : t("errors.GAME_ERROR")),
    [t],
  );

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    let mounted = true;
    import("js-confetti").then(({ default: JSConfetti }) => {
      if (mounted) confettiRef.current = new JSConfetti();
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const socket = createGameSocket();
    socketRef.current = socket;

    const bootstrap = () => {
      const current = roomRef.current;
      const target = targetCodeRef.current;

      if (current && target && current.code === target) return;
      if (current) socket.emit("room:leave");

      if (target) socket.emit("room:join", { code: target });
      else socket.emit("room:create", { shareId: createShareId, secondsPerQuestion: seconds, direction });
    };

    socket.on("game:ready", (payload: { userId: number; serverNow: number }) => {
      offsetRef.current = payload.serverNow - Date.now();
      userIdRef.current = payload.userId;
      setUserId(payload.userId);
      setConnected(true);
      socket.emit("time:ping");
      setTimeout(bootstrap, 250);
    });

    socket.on("time:pong", (payload: { serverNow: number }) => {
      offsetRef.current = payload.serverNow - Date.now();
    });

    socket.on("room:state", (payload: GameRoomView) => {
      setRoom(payload);
      if (targetCodeRef.current !== payload.code) {
        targetCodeRef.current = payload.code;
        window.history.replaceState(null, "", `/game/${payload.code}`);
      }
    });

    socket.on("game:countdown", (payload: { startsAt: number }) => {
      setCountdownAt(payload.startsAt);
      setQuestion(null);
      setReveal(null);
      setFinished(null);
    });

    socket.on("game:question", (payload: GameQuestionPayload) => {
      offsetRef.current = payload.serverNow - Date.now();
      setCountdownAt(null);
      setReveal(null);
      setQuestion(payload);
      setAnswer("");
      setSubmitted(false);
      setAnsweredCount({ answered: 0, total: 0 });
      setTimeout(() => inputRef.current?.focus(), 50);
    });

    socket.on("game:answered", (payload: { answeredCount: number; total: number }) => {
      setAnsweredCount({ answered: payload.answeredCount, total: payload.total });
    });

    socket.on("game:reveal", (payload: GameRevealPayload) => {
      setQuestion(null);
      setReveal(payload);
    });

    socket.on("game:finished", (payload: GameFinishedPayload) => {
      setQuestion(null);
      setReveal(null);
      setFinished(payload);
      confettiRef.current?.addConfetti();
    });

    socket.on("game:xp", (payload: GameXpPayload) => {
      const mine = payload.results.find((row) => row.userId === userIdRef.current);
      if (mine) setXpResult(mine);
    });

    socket.on("room:left", () => {
      setRoom(null);
      roomRef.current = null;
    });

    socket.on("room:closed", (payload: { reason: string }) => {
      toast.info(translate(`errors.${payload.reason}`));
      router.push("/groups");
    });

    socket.on("game:error", (payload: { code: string }) => {
      toast.error(translate(`errors.${payload.code}`));
      if (FATAL_CODES.has(payload.code)) router.push("/groups");
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!question && countdownAt === null) return;
    const id = setInterval(() => setTick((value) => value + 1), 100);
    return () => clearInterval(id);
  }, [question, countdownAt]);

  const handleSubmit = () => {
    if (!question || submitted || !answer.trim()) return;
    socketRef.current?.emit("answer:submit", { index: question.index, text: answer });
    setSubmitted(true);
  };

  const handleLeave = () => {
    socketRef.current?.emit("room:leave");
    router.push("/groups");
  };

  const handleCopyLink = () => {
    const target = roomRef.current?.code;
    if (!target) return;
    void navigator.clipboard
      .writeText(`${window.location.origin}/game/${target}`)
      .then(() => toast.success(t("linkCopied")))
      .catch(() => toast.error(t("errors.GAME_ERROR")));
  };

  if (finished) {
    return (
      <ResultsStage
        ranking={finished.ranking}
        currentUserId={userId}
        xpResult={xpResult}
        onBack={() => router.push("/groups")}
      />
    );
  }

  if (reveal) return <RevealStage reveal={reveal} currentUserId={userId} />;

  if (question) {
    const totalMs = question.deadline - question.startedAt;
    return (
      <QuestionStage
        question={question}
        remaining={question.deadline - serverNow()}
        totalMs={totalMs}
        answer={answer}
        submitted={submitted}
        answeredCount={answeredCount.answered}
        answeredTotal={answeredCount.total}
        inputRef={inputRef}
        onChange={setAnswer}
        onSubmit={handleSubmit}
      />
    );
  }

  if (countdownAt !== null) return <CountdownStage remaining={countdownAt - serverNow()} />;

  if (!room) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <div className="animate-pulse text-gray-400">
          {connected ? t("joining") : t("connecting")}
        </div>
      </div>
    );
  }

  return (
    <LobbyStage
      room={room}
      currentUserId={userId}
      isHost={room.hostUserId === userId}
      connectedCount={room.players.filter((player) => player.connected).length}
      onStart={() => socketRef.current?.emit("room:start")}
      onLeave={handleLeave}
      onCopyLink={handleCopyLink}
    />
  );
}
