"use client";

import { io, Socket } from "socket.io-client";
import { requestGameTicket } from "@/app/(dashboard)/game/actions";

const WS_URL =
  process.env.NEXT_PUBLIC_GAME_WS_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

export function createGameSocket(): Socket {
  return io(`${WS_URL}/game`, {
    transports: ["websocket"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: (cb: (data: Record<string, unknown>) => void) => {
      requestGameTicket()
        .then((result) => cb(result.success ? { ticket: result.ticket } : {}))
        .catch(() => cb({}));
    },
  });
}
