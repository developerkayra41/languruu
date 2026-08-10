"use server";

import { revalidatePath } from "next/cache";
import { upsertWord } from "@/app/lib/api-client";
import { WordColumn, WordPool } from "@/app/types/word";

type UpdateWordPoolResult =
  | { success: true; data: WordColumn }
  | { success: false; error: string };

export async function updateWordPool(
  group: WordColumn,
  updatedPool: WordPool[]
): Promise<UpdateWordPoolResult> {
  try {
    const updatedGroup: WordColumn = {
      ...group,
      wordPool: updatedPool,
    };

    const saved: WordColumn = await upsertWord(updatedGroup);

    revalidatePath("/study");
    revalidatePath("/words");
    revalidatePath("/add");

    return { success: true, data: saved };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu",
    };
  }
}