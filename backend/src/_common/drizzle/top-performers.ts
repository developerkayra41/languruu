import { json } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { baseColumns } from "src/_base/base.column";
import { TopPerformerData } from "../types/top-performers.type";

export const TopPerformers = pgTable('top_performers', {
    ...baseColumns,
    data: json('data').$type<TopPerformerData[]>()
})