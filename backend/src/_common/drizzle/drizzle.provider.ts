import { Provider } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { Pool, types } from 'pg';

const TIMESTAMP_OID = 1114;

const parseTimestampAsUtc = (value: string | null) => {
  if (value === null) return null;
  const parsed = new Date(`${value.replace(' ', 'T')}Z`);
  return Number.isNaN(parsed.getTime()) ? new Date(value) : parsed;
};

types.setTypeParser(TIMESTAMP_OID, parseTimestampAsUtc);

const poolTypes = {
  getTypeParser: (oid: number, format?: any) =>
    oid === TIMESTAMP_OID ? parseTimestampAsUtc : types.getTypeParser(oid, format),
};

export const DrizzleProvider: Provider = {
  provide: 'DRIZZLE',
  useFactory: async () => {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      types: poolTypes as any,
    });

    const db = drizzle(pool);

    // Bağlantıyı test et. Sorgu bilerek uygulamanın gerçek yolundan (drizzle
    // execute + AT TIME ZONE 'UTC') geçer; ham pool.query saat sapmasını gizler.
    try {
      const result = await db.execute(
        sql`SELECT now()::timestamp AT TIME ZONE 'UTC' AS now_utc`,
      );
      const nowUtc = new Date(result.rows[0].now_utc as string);
      const skewMinutes = Math.round((Date.now() - nowUtc.getTime()) / 60_000);
      console.log(
        `✅ Database connected | saat sapması: ${skewMinutes} dk (0 olmalı; değilse timestamp'ler UTC olarak dönmüyor)`,
      );
    } catch (error: any) {
      console.error('❌ Database connection failed:', error.message);
    }

    return db;
  },
};
