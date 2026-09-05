import { index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";

export const conversations = pgTable("conversations", {
    id: serial("id").primaryKey(),
    user_a_id: integer("user_a_id").notNull().references(() => users.id),
    user_b_id: integer("user_b_id").notNull().references(() => users.id),
    a_last_read_at: timestamp("a_last_read_at"),
    b_last_read_at: timestamp("b_last_read_at"),
    last_message_at: timestamp("last_message_at"),
    created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    pairUnique: uniqueIndex("conversations_pair_unique").on(table.user_a_id, table.user_b_id),
    aIdx: index("conversations_user_a_idx").on(table.user_a_id, table.last_message_at),
    bIdx: index("conversations_user_b_idx").on(table.user_b_id, table.last_message_at),
}));

export const messages = pgTable("messages", {
    id: serial("id").primaryKey(),
    conversation_id: integer("conversation_id").notNull().references(() => conversations.id),
    sender_id: integer("sender_id").notNull().references(() => users.id),
    body: text("body").notNull(),
    edited_at: timestamp("edited_at"),
    created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    threadIdx: index("messages_thread_idx").on(table.conversation_id, table.created_at),
    expiryIdx: index("messages_expiry_idx").on(table.created_at),
}));
