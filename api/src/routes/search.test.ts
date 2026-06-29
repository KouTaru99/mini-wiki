import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

interface SearchItem {
  id: number;
  title: string;
  slug: string;
  published_at: string | null;
  tags: unknown[];
}
interface SearchBody {
  data: SearchItem[];
  meta: { total: number; page: number; limit: number; query: string };
}
interface ErrorBody {
  error: { code: string; message: string };
}

describe('Search API — GET /api/search', () => {
  it('thiếu q → 400 QUERY_REQUIRED', async () => {
    const res = await request(app).get('/api/search');
    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).error.code).toBe('QUERY_REQUIRED');
  });

  it('tìm theo từ khóa trong title — trả đúng bài khớp', async () => {
    await request(app)
      .post('/api/articles')
      .send({ title: 'Docker tutorial', content: 'Container basics here' });
    await request(app)
      .post('/api/articles')
      .send({ title: 'Kubernetes guide', content: 'Orchestration platform' });

    const res = await request(app).get('/api/search?q=Docker');
    expect(res.status).toBe(200);
    const body = res.body as SearchBody;
    expect(body.data.length).toBe(1);
    expect(body.data[0].slug).toBe('docker-tutorial');
    expect(body.meta.query).toBe('Docker');
  });

  it('tìm theo từ khóa trong content', async () => {
    await request(app)
      .post('/api/articles')
      .send({ title: 'System design article', content: 'Microservice pattern is scalable' });

    const res = await request(app).get('/api/search?q=Microservice');
    expect(res.status).toBe(200);
    const body = res.body as SearchBody;
    expect(body.data.length).toBe(1);
  });

  it('từ khóa không khớp → data rỗng, total = 0', async () => {
    const res = await request(app).get('/api/search?q=xyznotexist999');
    expect(res.status).toBe(200);
    const body = res.body as SearchBody;
    expect(body.data).toEqual([]);
    expect(body.meta.total).toBe(0);
  });
});
