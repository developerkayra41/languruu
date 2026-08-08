export type ReportTargetType = 'profile' | 'word_group';
export type ReportReason = 'adult_content' | 'profanity' | 'spam' | 'other';
export type CreateReport = {
    reporter_user_id: number;
    target_type: ReportTargetType;
    target_ref: string;
    reason: ReportReason;
    description?: string | null;
};