import { afterAll, beforeEach } from 'vitest';
import { prisma } from '../lib/prisma.js';

// Xóa sạch dữ liệu trước mỗi test — đảm bảo test hoàn toàn độc lập
// RESTART IDENTITY: reset sequence id về 1 → id có thể đoán được trong assertion
beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE article_tags, articles, tags RESTART IDENTITY CASCADE',
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});
