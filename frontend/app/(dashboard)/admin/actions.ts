"use server";
import { getAdminUsers, banUser, unbanUser, resolveReport } from "@/app/lib/api-client";

export async function listUsersAction(params: { filter: string; search: string; page: number }) {
  try { const data = await getAdminUsers(params); return { success: true as const, ...data }; }
  catch (e: any) { return { success: false as const, error: e?.message ?? "Yüklenemedi.", items: [], total: 0 }; }
}
export async function banUserAction(id: number) {
  try { await banUser(id); return { success: true as const }; }
  catch (e: any) { return { success: false as const, error: e?.message ?? "Banlanamadı." }; }
}
export async function unbanUserAction(id: number) {
  try { await unbanUser(id); return { success: true as const }; }
  catch (e: any) { return { success: false as const, error: e?.message ?? "Kaldırılamadı." }; }
}

export async function resolveReportAction(id: number, status: string) {
  try { await resolveReport(id, status); return { success: true as const }; }
  catch (e: any) { return { success: false as const, error: e?.message ?? "İşlenemedi." }; }
}