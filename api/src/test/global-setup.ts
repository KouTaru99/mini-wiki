import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// api/src/test/ → ../../.. → repo root (nơi đặt docker-compose.yml)
const REPO_ROOT = path.resolve(__dirname, '../../..');
// api/src/test/ → ../.. → api/
const API_DIR = path.resolve(__dirname, '../..');

const TEST_DATABASE_URL = 'postgresql://dev:dev@localhost:5432/miniwiki_test';

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function waitForPostgres(maxAttempts = 30) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      execSync('docker compose exec -T db pg_isready -U dev', {
        cwd: REPO_ROOT,
        stdio: 'pipe',
      });
      console.log('[global-setup] PostgreSQL sẵn sàng.');
      return;
    } catch {
      console.log(`[global-setup] Chờ PostgreSQL khởi động... (${i}/${maxAttempts})`);
      await sleep(1000);
    }
  }
  throw new Error('[global-setup] PostgreSQL không khởi động được sau nhiều lần thử.');
}

export async function setup() {
  console.log('[global-setup] Khởi động docker compose db...');
  execSync('docker compose up -d db', { cwd: REPO_ROOT, stdio: 'inherit' });

  await waitForPostgres();

  // Tạo DB miniwiki_test nếu chưa tồn tại
  console.log('[global-setup] Kiểm tra / tạo database miniwiki_test...');
  const result = execSync(
    `docker compose exec -T db psql -U dev -d miniwiki -tc "SELECT 1 FROM pg_database WHERE datname='miniwiki_test'"`,
    { cwd: REPO_ROOT, stdio: 'pipe' },
  )
    .toString()
    .trim();

  if (!result.includes('1')) {
    execSync(
      'docker compose exec -T db psql -U dev -d miniwiki -c "CREATE DATABASE miniwiki_test"',
      { cwd: REPO_ROOT, stdio: 'inherit' },
    );
    console.log('[global-setup] Đã tạo database miniwiki_test.');
  } else {
    console.log('[global-setup] Database miniwiki_test đã tồn tại.');
  }

  // Chạy migration trên DB test
  console.log('[global-setup] Chạy Prisma migrations trên miniwiki_test...');
  execSync('npx prisma migrate deploy', {
    cwd: API_DIR,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
  console.log('[global-setup] Migration hoàn tất.');
}

export async function teardown() {
  // Không stop docker — để dev tái sử dụng giữa các lần chạy test
}
