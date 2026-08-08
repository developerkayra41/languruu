import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const securityEvents = pgTable("security_events", {
    id: serial("id").primaryKey(),
    event_type: text("event_type").notNull(),
    user_id: integer("user_id"),
    email: text("email"),
    ip_address: text("ip_address"),
    user_agent: text("user_agent"),
    metadata: jsonb("metadata"),
    created_at: timestamp("created_at").defaultNow().notNull(),
});