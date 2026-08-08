export type TopPerformerData = {
    user_id: number,
    user_name: string,
    full_name: string,
    total_word: number,
    streak: number,
    avatar_url?: string;
}

export type TopPerformerRow = {
    id: number;
    created_at: Date,
    updated_at: Date,
    data: TopPerformerData[],
    deleted_at?: Date,
}