import { index, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const notifications = pgTable("notifications", {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id),
    actor_user_id: integer("actor_user_id").references(() => users.id),
    type: text("type").notNull(),
    payload: jsonb("payload"),
    read_at: timestamp("read_at"),
    created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    userIdx: index("notifications_user_idx").on(table.user_id, table.created_at),
    unreadIdx: index("notifications_unread_idx").on(table.user_id, table.read_at),
}));
