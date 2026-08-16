export interface WordPool {
  term: string[];
  translation: string[];
  note?: string;
}

export interface WordColumn {
  id: number;
  shareId?: string;
  name: string;
  description?: string;
  wordPool: WordPool[];
  languages?: string[];
  createdAt: string;
  isShared: boolean;
  sourceShareId?: string;
  sourceAuthorUsername?: string;
}

export type NewWordColumn = Omit<WordColumn, "id">;
export type WordColumnWithoutPool = Omit<WordColumn, "wordPool"> & { word_count: number };

export interface BaseResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface TopPerformer {
  user_id: number;
  user_name: string;
  full_name: string;
  total_word: number;
  streak: number;
  avatar_url?: string;
}