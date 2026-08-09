"use server"

import { upsertWord } from "@/app/lib/api-client";
import { mergeNewEntryIntoPool } from "@/app/lib/word-pool-utils";
import { WordColumn, WordPool } from "@/app/types/word";
import { revalidatePath } from "next/cache";

type AddWordResult =
  | { success: true; data: WordColumn }
  | { success: false; error: string };


export async function addWordEntry(group: WordColumn, newEntry: WordPool): Promise<AddWordResult> {
    try {

        const mergedPool = mergeNewEntryIntoPool(group.wordPool, newEntry)

        const updatedGroup: WordColumn = {
            ...group,
            wordPool: mergedPool
        };

        const saved = await upsertWord(updatedGroup);
        revalidatePath("/study");
        revalidatePath("/words");
        revalidatePath("/add");

        return { success: true, data: saved };


    } catch (err){
        return {
            success:false,
            error: err instanceof Error ? err.message : "Bilinmeyen bir hata"
        }
    }
}