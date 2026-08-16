export type WordPool = {
    term: string[],
    translation: string[],
    note?: string
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
    sourceShareId?: string;
    sourceAuthorUsername?: string;
}

export type WordColumnWithoutPool = Omit<WordColumn, "wordPool"> & { word_count: number };