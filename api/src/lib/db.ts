import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// globalThis cache: ngăn tsx watch tạo nhiều Pool khi hot-reload
const globalForDb = globalThis as unknown as { pool?: Pool };

export const pool = globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

export const db = drizzle({ client: pool });
