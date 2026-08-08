"use server";

import { recordStudyComplete } from "@/app/lib/api-client";

// Bir grup tamamlanınca çağrılır: günlük seri + tamamlanan tur sayacını günceller.
// İstatistik güncellenemezse çalışma akışını bozmamak için sessizce geçilir.
export async function recordStudyCompleteAction() {
  try {
    await recordStudyComplete();
  } catch {
    // sessiz geç
  }
}
