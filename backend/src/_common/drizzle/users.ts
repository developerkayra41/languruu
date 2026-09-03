import { boolean, date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { baseColumns } from "src/_base/base.column";

export const users = pgTable("users", {
    ...baseColumns,
    user_name: text('user_name').unique(),
    full_name: text("full_name").notNull(),
    email: text("email").notNull().unique(),
    password: text("password"),
    google_id: text('google_id').unique(),
    description: text("description"),
    avatar_url: text("avatar_url"),
    email_verified: boolean("email_verified").notNull().default(false),
    verified_at: timestamp("verified_at"),
    last_seen_at: timestamp("last_seen_at"),
    is_banned: boolean("is_banned").notNull().default(false),
    banned_at: timestamp("banned_at"),
    token_valid_after: timestamp("token_valid_after"),
    discovery_source: text("discovery_source"),
    // İstatistikler
    study_streak: integer("study_streak").notNull().default(0),      // güncel günlük seri
    last_study_date: date("last_study_date"),                        // son "tamamlandı" günü (YYYY-MM-DD)
    completed_rounds: integer("completed_rounds").notNull().default(0), // toplam tamamlanan tur
    game_score: integer("game_score").notNull().default(0),          // yarış modunda toplanan puan
});
