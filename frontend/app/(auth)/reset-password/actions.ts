"use server";
import { resetPassword } from "@/app/lib/api-client";

export async function resetPasswordAction(token: string, password: string) {
    try {
        await resetPassword(token, password);
        return { success: true as const };
    } catch (e: any) {
        return { success: false as const, error: e?.message ?? "Sıfırlama başarısız." };
    }
}