export type CreateUserSession = {
    user_id: number,
    family_id:string,
    refresh_token_hash: string,
    device_id?: string | null,
    user_agent?: string,
    ip_address?: string,
    expires_at: Date,
}

export type UserSessionResult = {
    id: number,
    user_id: number,
    family_id:string;
    refresh_token_hash: string,
    device_id: string | null,
    user_agent: string,
    ip_address: string,
    is_revoked: boolean,
    expires_at: Date,
    created_at: Date,
    revoked_at: Date | null;
}