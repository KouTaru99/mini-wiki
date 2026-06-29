import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from './app.js';

interface ErrorBody {
  error: { code: string; message: string };
}

// Test cấp app: health check + các nhánh middleware (notFound, errorHandler khi
// thao tác trên bản ghi không tồn tại → Prisma P2025 → 404).
describe('App — middleware & health', () => {
  it('GET /health trả 200 status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect((res.body as { status: string }).status).toBe('ok');
  });

  it('route không khớp → 404 ROUTE_NOT_FOUND (notFound middleware)', async () => {
    const res = await request(app).get('/khong-ton-tai-dau');
    expect(res.status).toBe(404);
    expect((res.body as ErrorBody).error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('PUT bài viết không tồn tại → 404 (errorHandler map Prisma P2025)', async () => {
    const res = await request(app)
      .put('/api/articles/slug-khong-ton-tai')
      .send({ title: 'Mới' });
    expect(res.status).toBe(404);
  });

  it('DELETE bài viết không tồn tại → 404 (errorHandler map Prisma P2025)', async () => {
    const res = await request(app).delete('/api/articles/slug-khong-ton-tai');
    expect(res.status).toBe(404);
  });
});
