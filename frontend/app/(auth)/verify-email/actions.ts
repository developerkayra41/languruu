"use server";
import { verifyEmail } from "@/app/lib/api-client";

export async function verifyEmailAction(token: string) {
    try {
        await verifyEmail(token);
        return { success: true as const };
    } catch (e: any) {
        return { success: false as const, error: e?.message ?? "Doğrulama başarısız." };
    }
}