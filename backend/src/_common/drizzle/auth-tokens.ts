import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const authTokens = pgTable("auth_tokens", {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id),
    token_hash: text("token_hash").notNull(),
    purpose: text("purpose").notNull(),          // 'email_verify' | 'password_reset'
    expires_at: timestamp("expires_at").notNull(),
    used_at: timestamp("used_at"),
    created_at: timestamp("created_at").defaultNow().notNull(),
});