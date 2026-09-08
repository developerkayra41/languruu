"use server";
import { unsubscribeReengagement } from "@/app/lib/api-client";

export async function unsubscribeAction(token: string) {
  try { const data = await unsubscribeReengagement(token); return { success: true as const, ...data }; }
  catch (e: any) { return { success: false as const, error: e?.message ?? "INVALID_UNSUBSCRIBE_TOKEN" }; }
}
