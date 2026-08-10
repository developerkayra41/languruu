"use server";

import { recordStudyComplete } from "@/app/lib/api-client";

export async function recordStudyCompleteAction() {
  try {
    await recordStudyComplete();
  } catch {
  }
}
