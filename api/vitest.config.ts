import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

// Load .env.test trước để lấy DATABASE_URL truyền vào worker (prisma đọc env lúc import)
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
      exclude: ['src/index.ts', '**/*.test.ts', 'src/test/**'],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
        branches: 70,
      },
    },
  },
});
