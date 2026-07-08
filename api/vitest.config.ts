import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

// Load .env.test trước để lấy DATABASE_URL truyền vào worker (db client đọc env lúc import)
dotenv.config({ path: '.env.test' });

export default defineConfig({
  test: {
    environment: 'node',
    // Truyền DATABASE_URL test vào mỗi worker — đảm bảo không dính DB dev
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
    },
    globalSetup: 'src/test/global-setup.ts',
    setupFiles: ['src/test/setup.ts'],
    // Chạy file test tuần tự — tránh đụng độ khi nhiều worker cùng truncate DB test
    fileParallelism: false,
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      // src/db/**: schema (khai báo thuần) + script CLI độc lập (migrate/seed/reset,
      // chạy qua tsx, không phải business logic đi qua HTTP layer) — tương đương
      // cách prisma/schema.prisma + prisma/seed.ts trước đây nằm ngoài src/, nên
      // chưa từng bị tính vào coverage.
      exclude: ['src/index.ts', '**/*.test.ts', 'src/test/**', 'src/db/**'],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
        branches: 70,
      },
    },
  },
});
