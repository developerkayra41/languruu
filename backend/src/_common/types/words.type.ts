export type WordPool = {
    term: string[],
    translation: string[]
}

export type WordRow = {
    id: number;
    user_id: number;
    words: WordColumn[]
}

export type WordColumn = {
    id: number;
    shareId?: string;
    name: string;
    description?: string;
    wordPool: WordPool[];
    languages: string[];
    createdAt: Date;
    isShared: boolean;
    sourceShareId?: string;         // bu grup bir marketplace kopyasıysa, orijinalin share_id'si
    sourceAuthorUsername?: string;  // orijinal sahibin kullanıcı adı (denormalize, gösterim için)
}

// types/word.ts
export type WordColumnWithoutPool = Omit<WordColumn, "wordPool"> & { word_count: number };