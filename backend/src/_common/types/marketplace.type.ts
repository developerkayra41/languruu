export type MarketplaceEntry = {
    id: number;
    share_id: string;
    owner_user_id: number;
    author_name: string;
    author_username: string;
    name: string;
    description?: string;
    word_count: number;
    languages: string[];
    source_language?: string | null;
    target_language?: string | null;
    downloads: number;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
};