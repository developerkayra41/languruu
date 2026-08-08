
import { serial, integer, pgTable } from "drizzle-orm/pg-core";
import { users } from "./users";
import { jsonb } from "drizzle-orm/pg-core";
import { WordColumn } from "../types/words.type";
import { timestamp } from "drizzle-orm/pg-core";


export const Words = pgTable("words", {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
        .notNull()
        .references(() => users.id)
        .unique(),
    words: jsonb("words")
        .$type<WordColumn[]>(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull()
})