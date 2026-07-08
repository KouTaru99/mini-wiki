import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

// __dirname ở cả 2 dạng src/db/ (dev, tsx) và dist/db/ (prod, compiled) đều
// cách api/drizzle/ đúng 2 cấp — dùng đường dẫn tuyệt đối để không phụ thuộc
// vào cwd lúc chạy lệnh (dev chạy từ api/, Docker CMD chạy từ /app).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, '../../drizzle');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  console.log(`Đang áp migration từ ${migrationsFolder} ...`);
  await migrate(db, { migrationsFolder });
  await pool.end();
  console.log('✓ Migration hoàn tất.');
}

main().catch((err: unknown) => {
  console.error('Migration thất bại:', err);
  process.exit(1);
});
