import { sql } from 'drizzle-orm';

export const utc = (expression: string) => sql.raw(`${expression} AT TIME ZONE 'UTC'`);
