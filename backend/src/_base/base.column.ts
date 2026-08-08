// src/db/base-columns.ts
import { serial, timestamp } from "drizzle-orm/pg-core";

export const baseColumns = {
    id: serial("id").primaryKey(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
    deleted_at: timestamp("deleted_at"),
};
