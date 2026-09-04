import { cookies } from "next/headers";
import { MarketplaceSearchResult, PoolDetail } from "../types/marketplace"
import { BaseResponse, NewWordColumn, TopPerformer, WordColumn, WordColumnWithoutPool, WordPool } from "../types/word"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function getAuthHeaders(): Promise<HeadersInit> {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

// lib/api-client.ts
import { redirect } from "next/navigation";
import { AdminDiscoverySource, AdminError, AdminSecurityEvent, AdminStats, AdminUsersPage } from "../types/admin";
import { GameRoomSummary, GameTicket } from "../types/game";

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_BASE_URL}/api${path}`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
    });

    // 401 = token geçersiz/süresi dolmuş. Mesaj metnine bakmadan, doğrudan login'e yönlendir.
    if (res.status === 401) {
        redirect("/login");
    }

    let json: BaseResponse<T> | null = null;
    try { json = await res.json(); } catch { }

    // 403 + ACCOUNT_SUSPENDED = hesap askıya alınmış. Diğer iş kaynaklı 403'lerden
    // (kod ile) ayrılır ve özel askıya-alındı sayfasına yönlendirilir.
    if (res.status === 403 && json?.message === "ACCOUNT_SUSPENDED") {
        redirect("/suspended");
    }

    if (!res.ok) {
        throw new Error(json?.message || `API Hatası: ${res.status} ${res.statusText}`);
    }
    if (!json || !json.success) {
        throw new Error(json?.message || "Bilinmeyen bir hata oluştu");
    }
    return json.data;
}

async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}/api${path}`, {
        method: "GET",
        headers: await getAuthHeaders(),
        cache: "no-store",
    });
    if (res.status === 401) redirect("/login");
    let json: BaseResponse<T> | null = null;
    try { json = await res.json(); } catch { }
    if (res.status === 403 && json?.message === "ACCOUNT_SUSPENDED") redirect("/suspended");
    if (!res.ok) throw new Error(json?.message || `API Hatası: ${res.status}`);
    if (!json || !json.success) throw new Error(json?.message || "Bilinmeyen bir hata oluştu");
    return json.data;
}

// post /users/wordsInfo - grup listesi (wordPool Hariç, hafif verir)
export async function getWordsInfo(): Promise<WordColumnWithoutPool[]> {
    return apiPost<WordColumnWithoutPool[]>("/words/wordsInfo");
}

// post /users/words - tek bir grubun tüm kelimeriyle (wordPool dahil)
export async function getWordsByWordId(wordId: number): Promise<WordColumn> {
    return apiPost<WordColumn>("/words", { word_id: wordId })
}

export async function upsertWord(
    word: WordColumn | NewWordColumn
): Promise<WordColumn> {
    const result: WordColumn = await apiPost<WordColumn>("/words/upsertWord", {
        words: word,
    });
    return result;
}

export async function deleteWord(wordId: number): Promise<WordColumn> {
    return apiPost<WordColumn>("/words/deleteWord", { word_id: wordId });
}

export async function getTopPerformers(): Promise<TopPerformer[]> {
    return apiPost<TopPerformer[]>("/top-performers");
}

// app/lib/api-client.ts içine

export async function searchMarketplace(params: {
    search?: string;
    languages?: string[];
    sourceLanguage?: string;
    targetLanguage?: string;
    onlyMine?: boolean;
    page: number;
    pageSize: number;
}): Promise<MarketplaceSearchResult> {
    return apiPost<MarketplaceSearchResult>("/marketplace/search", params);
}

export async function unshareMarketplaceEntry(shareId: string): Promise<WordColumn> {
    return apiPost<WordColumn>("/marketplace/unshare", { share_id: shareId });
}

export async function copyMarketplaceEntry(shareId: string): Promise<WordColumn> {
    return apiPost<WordColumn>("/marketplace/copy", { share_id: shareId });
}

export async function getPoolDetail(shareId: string): Promise<PoolDetail> {
    return apiPost<PoolDetail>("/marketplace/pool-detail", { share_id: shareId });
}

export async function getProfile(): Promise<{
    user_name: string;
    full_name: string;
    avatar_url?: string;
    description: string;
    email: string;
    total_words: number;
    word_pool_count: number;
    daily_streak: number;
    completed_rounds: number;
    game_score: number;
    xp: number;
    level: number;
    xp_into_level: number;
    xp_for_next: number;
    email_verified: boolean;
    has_password: boolean;
    is_admin: boolean;
    needs_discovery_prompt: boolean;
}> {
    return apiPost("/users/profile");
}

export async function setDiscoverySource(source: string) {
    return apiPost<{ discovery_source: string }>("/users/discovery-source", { source });
}

export async function recordStudyComplete() {
    return apiPost("/users/study/complete");
}

export async function awardXp(words: number): Promise<{
    xp: number;
    level: number;
    xp_into_level: number;
    xp_for_next: number;
    gained: number;
}> {
    return apiPost("/users/xp/award", { words });
}

export async function getPublicProfile(userName: string): Promise<{
    user_name: string;
    full_name: string;
    avatar_url?: string;
    description: string;
    total_words: number;
    daily_streak: number;
    completed_rounds: number;
    word_pool_count: number;
    game_score: number;
    xp: number;
    level: number;
    xp_into_level: number;
    xp_for_next: number;
}> {
    return apiPost("/users/public-profile", { user_name: userName });
}

export async function getAvatarUploadUrl(extension: string) {
    return apiPost<{ signedUrl: string; token: string; path: string; publicUrl: string }>(
        "/users/avatar/upload-url",
        { extension }
    );
}

export async function updateProfile(data: { user_name?: string; full_name?: string; description?: string; avatar_url?: string }) {
    return apiPost<{ user_name: string; full_name: string; description?: string; avatar_url?: string }>("/users/profile/update", data);
}

export async function deleteAvatar(): Promise<{ user_name: string; avatar_url?: string }> {
    return apiPost("/users/avatar/delete");
}

export async function loginRequest(identifier: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
    });
    return res;
}

export async function registerRequest(data: { user_name: string; email: string; full_name: string; password: string }) {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res;
}

export async function googleAuthRequest(idToken: string) {
    const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
    });
    return res;
}

export async function verifyEmail(token: string): Promise<{ success: boolean }> {
    return apiPost("/auth/verify-email", { token });
}

export async function resendVerification(): Promise<{ success: boolean }> {
    return apiPost("/auth/resend-verification");
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean }> {
    return apiPost("/auth/request-password-reset", { email });
}

export async function resetPassword(token: string, password: string): Promise<{ success: boolean }> {
    return apiPost("/auth/reset-password", { token, password });
}

export async function updateEmail(newEmail: string, currentPassword: string) {
    return apiPost("/users/settings/email", { new_email: newEmail, current_password: currentPassword });
}

export async function updatePassword(currentPassword: string, newPassword: string) {
    return apiPost("/users/settings/password", { current_password: currentPassword, new_password: newPassword });
}

export async function logoutAllDevices() {
    return apiPost("/auth/logout-all");
}

export async function deleteAccount(password: string) {
    return apiPost("/auth/delete-account", { password });
}

export async function getAdminStats(): Promise<AdminStats> {
    return apiGet<AdminStats>("/admin/stats");
}

export async function getAdminUsers(params?: { filter?: string; search?: string; page?: number }): Promise<AdminUsersPage> {
    const qs = new URLSearchParams();
    if (params?.filter) qs.set("filter", params.filter);
    if (params?.search) qs.set("search", params.search);
    if (params?.page) qs.set("page", String(params.page));
    const q = qs.toString();
    return apiGet(`/admin/users${q ? `?${q}` : ""}`);
}

export async function getAdminDiscoverySources(): Promise<AdminDiscoverySource[]> { return apiGet("/admin/discovery-sources"); }
export async function getAdminErrors(): Promise<AdminError[]> { return apiGet("/admin/errors"); }
export async function getAdminSecurityEvents(): Promise<AdminSecurityEvent[]> { return apiGet("/admin/security-events"); }
export async function banUser(id: number) { return apiPost(`/admin/users/${id}/ban`); }
export async function unbanUser(id: number) { return apiPost(`/admin/users/${id}/unban`); }

export async function getGameTicket(): Promise<GameTicket> {
    return apiPost<GameTicket>("/game/ticket");
}

export async function getGameRooms(shareId: string): Promise<GameRoomSummary[]> {
    return apiPost<GameRoomSummary[]>("/game/rooms", { share_id: shareId });
}

export async function createReport(payload: { target_type: string; target_ref: string; reason: string; description?: string }) {
    return apiPost('/reports', payload)
}

export interface AdminReport {
    id: number; target_type: string; target_ref: string; reason: string;
    description: string | null; status: string; created_at: string; reporter_username: string | null;
}
export async function getAdminReports(status?: string): Promise<AdminReport[]> {
    return apiGet(`/admin/reports${status ? `?status=${status}` : ""}`);
}
export async function resolveReport(id: number, status: string) {
    return apiPost(`/admin/reports/${id}/resolve`, { status });
}