export type AuthUser = {
    id: number;
    user_name: string;
    email: string;
    password: string;
    full_name: string;
    description: string | null;
    avatar_url: string | null;
    updated_at: Date;
    discovery_source?: string | null;
    needs_profile_setup?: boolean | null;
    presence_visibility?: string | null;
    email_verified: boolean;
    is_banned: boolean;
};
