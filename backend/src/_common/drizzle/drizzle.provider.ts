import { Provider } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export const DrizzleProvider: Provider = {
  provide: 'DRIZZLE',
  useFactory: async () => {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    // Bağlantıyı test et
    try {
      const result = await pool.query('SELECT NOW()');
      console.log('✅ Database connected:', result.rows[0]);
    } catch (error: any) {
      console.error('❌ Database connection failed:', error.message);
    }

    return drizzle(pool);
  },
};