import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const globalMessages = pgTable("global_messages", {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id),
    body: text("body").notNull(),
    edited_at: timestamp("edited_at"),
    created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    feedIdx: index("global_messages_feed_idx").on(table.created_at),
    authorIdx: index("global_messages_author_idx").on(table.user_id),
}));
