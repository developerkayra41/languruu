import { WordPool } from "./word";

export interface MarketplaceEntry {
  id: number;
  share_id: string;
  owner_user_id: number;
  author_name: string;
  author_username: string;
  name: string;
  description?: string;
  word_count: number;
  languages: string[];
  downloads: number;
  created_at: string;
   is_own: boolean;   
}

export interface MarketplaceSearchResult {
  items: MarketplaceEntry[];
  total: number;
}

export interface PoolDetail {
  name: string;
  description?: string;
  languages: string[];
  author_name: string;
  author_username: string;
  wordPool: WordPool[];   // WordPool zaten types/word.ts'te tanımlıydı
}