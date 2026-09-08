export interface AdminStats { total_users: number; users_today: number; users_week: number; online_now: number; shared_groups: number; total_groups: number; total_words: number }
export interface AdminUser { id: number; user_name: string; full_name: string; email: string; created_at: string; is_banned: boolean; last_seen_at: string | null; }
export interface AdminError { id: number; message: string; path: string; method: string; status: number; user_id: number | null; created_at: string; }
export interface AdminUsersPage { items: AdminUser[]; total: number; }
export interface AdminSecurityEvent { id: number; event_type: string; user_id: number | null; email: string | null; ip_address: string | null; created_at: string; }
export interface AdminDiscoverySource { source: string; count: number }
export interface AdminReengagement { eligible: number; inactive_days: number; cooldown_days: number; batch_limit: number }
export interface AdminReengagementRun { sent: number; failed: number; eligible: number }
export interface AdminReengagementSend { sent: boolean; matched_user: boolean; opted_out: boolean }
