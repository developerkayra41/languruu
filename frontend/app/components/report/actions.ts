"use server"

import { createReport } from "@/app/lib/api-client";

export async function submitReportAction(payload: {
    target_type: string; target_ref: string; reason: string;
    description?: string
}) {
    try {
        await createReport(payload);
        return { success: true as const };
    } catch (e: any) {
        return { success: false as const, error: e?.message ?? 'Şikayet gönderilmedi' }
    }
}