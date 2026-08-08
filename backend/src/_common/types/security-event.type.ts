export type SecurityEventType =
    | 'login_success'
    | 'login_failed'
    | 'refresh_reuse_detected'
    | 'logout'
    | 'password_changed'
    | 'email_changed'
    | 'avatar_not_deleted';

export type CreateSecurityEvent = {
    event_type: SecurityEventType;
    user_id?: number | null;
    email?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
    metadata?: Record<string, unknown> | null;
};