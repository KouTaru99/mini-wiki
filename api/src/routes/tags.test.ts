import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

interface TagBody {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}
interface ErrorBody {
  error: { code: string; message: string };
}

describe('Tags API — /api/tags', () => {
  // ── GET / ─────────────────────────────────────────────────────────────────
  describe('GET /', () => {
    it('trả về 200 và mảng rỗng khi chưa có tag', async () => {
      const res = await request(app).get('/api/tags');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('trả về danh sách tag sau khi tạo', async () => {
      await request(app).post('/api/tags').send({ name: 'DevOps' });
      const res = await request(app).get('/api/tags');
      expect(res.status).toBe(200);
      expect((res.body as TagBody[]).length).toBe(1);
      expect((res.body as TagBody[])[0].name).toBe('DevOps');
    });
  });

  // ── POST / ────────────────────────────────────────────────────────────────
  describe('POST /', () => {
    it('tạo thành công → 201, có id và slug', async () => {
      const res = await request(app).post('/api/tags').send({ name: 'Git' });
      expect(res.status).toBe(201);
      const body = res.body as TagBody;
      expect(body.id).toBeGreaterThan(0);
      expect(body.slug).toBe('git');
      expect(body.name).toBe('Git');
    });

    it('thiếu name → 400 MISSING_FIELD', async () => {
      const res = await request(app).post('/api/tags').send({});
      expect(res.status).toBe(400);
      expect((res.body as ErrorBody).error.code).toBe('MISSING_FIELD');
    });
  });

  // ── DELETE /:id ───────────────────────────────────────────────────────────
  describe('DELETE /:id', () => {
    it('xóa tag chưa gắn bài viết → 204', async () => {
      const create = await request(app).post('/api/tags').send({ name: 'Tag Can Xoa' });
      const tag = create.body as TagBody;
      const del = await request(app).delete(`/api/tags/${tag.id}`);
      expect(del.status).toBe(204);
    });

    it('xóa tag đang gắn bài viết → 409 TAG_IN_USE', async () => {
      // Tạo tag rồi gắn vào bài viết
      const tagRes = await request(app).post('/api/tags').send({ name: 'Tag Dang Dung' });
      const tag = tagRes.body as TagBody;
      await request(app)
        .post('/api/articles')
        .send({ title: 'Bai gan tag', content: '# Nội dung', tagIds: [tag.id] });

      const del = await request(app).delete(`/api/tags/${tag.id}`);
      expect(del.status).toBe(409);
      expect((del.body as ErrorBody).error.code).toBe('TAG_IN_USE');
    });

    it('id không tồn tại → 404 TAG_NOT_FOUND', async () => {
      const del = await request(app).delete('/api/tags/99999');
      expect(del.status).toBe(404);
      expect((del.body as ErrorBody).error.code).toBe('TAG_NOT_FOUND');
    });
  });
});
