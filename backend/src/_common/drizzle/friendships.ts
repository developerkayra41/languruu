import { index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";

export const friendships = pgTable("friendships", {
    id: serial("id").primaryKey(),
    requester_id: integer("requester_id").notNull().references(() => users.id),
    addressee_id: integer("addressee_id").notNull().references(() => users.id),
    status: text("status").notNull().default("pending"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    responded_at: timestamp("responded_at"),
}, (table) => ({
    pairUnique: uniqueIndex("friendships_pair_unique").on(table.requester_id, table.addressee_id),
    addresseeIdx: index("friendships_addressee_idx").on(table.addressee_id, table.status),
    requesterIdx: index("friendships_requester_idx").on(table.requester_id, table.status),
}));
