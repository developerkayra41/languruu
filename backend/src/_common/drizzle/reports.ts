import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const reports = pgTable("reports", {
    id: serial("id").primaryKey(),
    reporter_user_id: integer("reporter_user_id").notNull().references(() => users.id),
    target_type: text("target_type").notNull(),
    target_ref: text("target_ref").notNull(),
    reason: text("reason").notNull(),
    description: text("description"),
    status: text("status").notNull().default("open"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    reviewed_at: timestamp("reviewed_at"),
});