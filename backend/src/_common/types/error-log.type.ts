export type CreateErrorLog = {
    message: string;
    stack?: string | null;
    path?: string | null;
    method?: string | null;
    status?: number | null;
    user_id?: number | null;
    metadata?: Record<string, unknown> | null;
};