import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";

export const userSessions = pgTable("user_sessions", {
    id: serial("id").primaryKey(),

    user_id: integer("user_id")
        .notNull()
        .references(() => users.id),

    family_id: text("family_id")
        .notNull(),

    refresh_token_hash: text("refresh_token_hash").notNull(),

    device_id: text("device_id"),     
    user_agent: text("user_agent"),      
    ip_address: text("ip_address"),

    is_revoked: boolean("is_revoked").default(false).notNull(),

    expires_at: timestamp("expires_at").notNull(),

    created_at: timestamp("created_at").defaultNow(),
    revoked_at: timestamp("revoked_at"),
}); 
