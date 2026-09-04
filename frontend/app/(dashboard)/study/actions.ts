"use server";

import { awardXp, recordStudyComplete } from "@/app/lib/api-client";

export async function recordStudyCompleteAction() {
  try {
    await recordStudyComplete();
  } catch {
  }
}

export async function awardXpAction(words: number) {
  try {
    return await awardXp(words);
  } catch {
    return null;
  }
}
