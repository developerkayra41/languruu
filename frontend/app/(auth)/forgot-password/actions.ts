"use server";
import { requestPasswordReset } from "@/app/lib/api-client";

export async function forgotPasswordAction(email: string) {
  try {
    await requestPasswordReset(email);
  } catch {
  }
  return { success: true as const };
}