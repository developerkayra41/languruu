"use server";
import { requestPasswordReset } from "@/app/lib/api-client";

export async function forgotPasswordAction(email: string) {
  try {
    await requestPasswordReset(email);
  } catch {
    // Enumerasyon önleme: hata olsa da kullanıcıya aynı mesajı göstereceğiz
  }
  return { success: true as const };
}