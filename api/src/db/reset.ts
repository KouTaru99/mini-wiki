import { sql } from 'drizzle-orm';
import { db, pool } from '../lib/db.js';

// Tương đương `prisma migrate reset --force`: xóa sạch schema public rồi tạo
// lại rỗng — chạy xong cần `npm run migrate && npm run seed` để khôi phục.
async function main() {
  console.log('⚠ Xóa schema "public" và tạo lại rỗng...');
  await db.execute(sql`DROP SCHEMA public CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);
  await pool.end();
  console.log('✓ Đã reset — chạy `npm run migrate && npm run seed` để khôi phục.');
}

main().catch((err: unknown) => {
  console.error('Reset thất bại:', err);
  process.exit(1);
});
