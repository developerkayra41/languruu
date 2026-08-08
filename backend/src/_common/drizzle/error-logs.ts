import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const errorLogs = pgTable("error_logs", {
    id: serial("id").primaryKey(),
    message: text("message").notNull(),
    stack: text("stack"),
    path: text("path"),
    method: text("method"),
    status: integer("status"),
    user_id: integer("user_id"),
    metadata: jsonb("metadata"),
    created_at: timestamp("created_at").defaultNow().notNull(),
});