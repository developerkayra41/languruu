"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getWordsByWordId, upsertWord } from "@/app/lib/api-client";
import { NewWordColumn, WordColumn } from "@/app/types/word";

const ACTIVE_GROUP_COOKIE = "activeGroupId";

export async function setActiveGroup(groupId: number) {
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_GROUP_COOKIE, String(groupId), {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
    });
    redirect("/study");
}

type CreateGroupResult = { success: true; createdGroup: WordColumn } | { success: false; error: string }

export async function createGroup(
    name: string,
    description: string,
    languages: string[]
): Promise<CreateGroupResult> {
    try {
        if (!name.trim()) {
            return { success: false, error: "Grup adı boş olamaz." };
        }
        if (languages.length !== 2 || languages[0] === languages[1]) {
            return { success: false, error: "Lütfen iki farklı dil seçin." };
        }

        const newGroup: NewWordColumn = {
            name: name.trim(),
            description: description.trim() || undefined,
            wordPool: [],
            languages,
            createdAt: new Date().toISOString(),
            isShared: false,
        };

        const createdGroup = await upsertWord(newGroup);

        revalidatePath("/groups");
        revalidatePath("/study");

        return { success: true, createdGroup };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu",
        };
    }
}

type ToggleShareResult =
    | { success: true; isShared: boolean }
    | { success: false; error: string };

export async function toggleGroupShare(
    groupId: number,
    isShared: boolean
): Promise<ToggleShareResult> {
    try {
        const fullGroup = await getWordsByWordId(groupId);
        const updatedGroup: WordColumn = { ...fullGroup, isShared };
        await upsertWord(updatedGroup);
        revalidatePath("/groups");
        return { success: true, isShared };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu",
        };
    }
}