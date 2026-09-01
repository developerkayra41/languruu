"use server";

import { revalidatePath } from "next/cache";
import { copyMarketplaceEntry, getGameRooms, getGameTicket } from "@/app/lib/api-client";
import { GameRoomSummary } from "@/app/types/game";

function isRedirect(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "digest" in error &&
        String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
    );
}

function toErrorCode(error: unknown): string {
    const message = error instanceof Error ? error.message : "";
    return /^[A-Z_]+$/.test(message) ? message : "GAME_ERROR";
}

type TicketResult = { success: true; ticket: string } | { success: false; error: string };

export async function requestGameTicket(): Promise<TicketResult> {
    try {
        const data = await getGameTicket();
        return { success: true, ticket: data.ticket };
    } catch (error) {
        if (isRedirect(error)) throw error;
        return { success: false, error: toErrorCode(error) };
    }
}

type RoomsResult = { success: true; rooms: GameRoomSummary[] } | { success: false; error: string };

export async function fetchGameRooms(shareId: string): Promise<RoomsResult> {
    try {
        const rooms = await getGameRooms(shareId);
        return { success: true, rooms };
    } catch (error) {
        if (isRedirect(error)) throw error;
        return { success: false, error: toErrorCode(error) };
    }
}

type CopyResult = { success: true } | { success: false; error: string };

export async function addGroupForGame(shareId: string): Promise<CopyResult> {
    try {
        await copyMarketplaceEntry(shareId);
        revalidatePath("/groups");
        revalidatePath("/marketplace");
        return { success: true };
    } catch (error) {
        if (isRedirect(error)) throw error;
        return { success: false, error: error instanceof Error ? error.message : "GAME_ERROR" };
    }
}
