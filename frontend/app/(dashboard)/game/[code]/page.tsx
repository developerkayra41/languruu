import type { Metadata } from "next";
import GameRoomClient from "./GameRoomClient";
import { GameDirection, GameSeconds } from "@/app/types/game";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function toSeconds(value: string | string[] | undefined): GameSeconds {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return parsed === 10 || parsed === 30 ? parsed : 20;
}

function toDirection(value: string | string[] | undefined): GameDirection {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return parsed === 1 || parsed === 2 ? parsed : 3;
}

export default async function GameRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { code } = await params;
  const query = await searchParams;

  const share = Array.isArray(query.share) ? query.share[0] : query.share;
  const isCreate = code === "new";

  return (
    <div className="max-w-2xl mx-auto">
      <GameRoomClient
        code={code}
        createShareId={isCreate ? (share ?? null) : null}
        seconds={toSeconds(query.seconds)}
        direction={toDirection(query.direction)}
      />
    </div>
  );
}
