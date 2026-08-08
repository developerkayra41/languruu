// src/_common/drizzle/marketplace.ts — düzeltildi
import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { baseColumns } from "src/_base/base.column";

export const Marketplace = pgTable("market_place", {
    ...baseColumns,
    share_id: text("share_id").notNull().unique(),
    owner_user_id: integer("owner_user_id").notNull(),
    author_name: text("author_name").notNull(),
    author_username: text("author_username").notNull(),  // unique YOK
    name: text("name").notNull(),
    description: text("description"),
    word_count: integer("word_count").notNull(),
    languages: text("languages").array(),
    source_language:text('source_language'),
    target_language: text('target_language'),
    downloads: integer("downloads").notNull().default(0),

});