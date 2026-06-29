import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

// Shape response — chỉ khai báo field cần assert, không cần full model
interface ArticleBody {
  id: number;
  title: string;
  slug: string;
  content?: string;
  content_html?: string;
  published_at: string | null;
  tags: { id: number; name: string; slug: string }[];
}
interface ListBody {
  data: ArticleBody[];
  meta: { total: number; page: number; limit: number };
}
interface ErrorBody {
  error: { code: string; message: string };
}

describe('Articles API — /api/articles', () => {
  // ── GET / — danh sách ──────────────────────────────────────────────────────
  describe('GET /', () => {
    it('trả về 200 và data rỗng khi chưa có bài viết', async () => {
      const res = await request(app).get('/api/articles');
      expect(res.status).toBe(200);
      expect((res.body as ListBody).data).toEqual([]);
      expect((res.body as ListBody).meta.total).toBe(0);
    });
  });

  // ── POST / — tạo bài ──────────────────────────────────────────────────────
  describe('POST /', () => {
    it('tạo thành công → 201, response có slug đúng', async () => {
      const res = await request(app)
        .post('/api/articles')
        .send({ title: 'Bài viết đầu tiên', content: '# Nội dung' });
      expect(res.status).toBe(201);
      const body = res.body as ArticleBody;
      expect(body.slug).toBe('bai-viet-dau-tien');
      expect(body.title).toBe('Bài viết đầu tiên');
    });

    it('thiếu title → 400 MISSING_FIELD', async () => {
      const res = await request(app)
        .post('/api/articles')
        .send({ content: '# Nội dung' });
      expect(res.status).toBe(400);
      expect((res.body as ErrorBody).error.code).toBe('MISSING_FIELD');
    });

    it('thiếu content → 400 MISSING_FIELD', async () => {
      const res = await request(app)
        .post('/api/articles')
        .send({ title: 'Không có content' });
      expect(res.status).toBe(400);
      expect((res.body as ErrorBody).error.code).toBe('MISSING_FIELD');
    });

    it('title trùng (slug trùng) → 409 SLUG_CONFLICT', async () => {
      await request(app)
        .post('/api/articles')
        .send({ title: 'Bài trùng slug', content: '# Lần 1' });
      const res = await request(app)
        .post('/api/articles')
        .send({ title: 'Bài trùng slug', content: '# Lần 2' });
      expect(res.status).toBe(409);
      expect((res.body as ErrorBody).error.code).toBe('SLUG_CONFLICT');
    });
  });

  // ── GET /:slug — chi tiết ─────────────────────────────────────────────────
  describe('GET /:slug', () => {
    it('trả về 200 và content_html (markdown đã render)', async () => {
      await request(app)
        .post('/api/articles')
        .send({ title: 'Chi tiet bai', content: '## Tiêu đề phụ' });
      const res = await request(app).get('/api/articles/chi-tiet-bai');
      expect(res.status).toBe(200);
      const body = res.body as ArticleBody;
      expect(body.slug).toBe('chi-tiet-bai');
      expect(body.content_html).toContain('<h2>');
    });

    it('slug không tồn tại → 404', async () => {
      const res = await request(app).get('/api/articles/khong-co');
      expect(res.status).toBe(404);
    });
  });

  // ── PUT /:slug — cập nhật ─────────────────────────────────────────────────
  describe('PUT /:slug', () => {
    it('cập nhật thành công → 200, title và slug mới', async () => {
      await request(app)
        .post('/api/articles')
        .send({ title: 'Bai goc can sua', content: '# Cũ' });
      const res = await request(app)
        .put('/api/articles/bai-goc-can-sua')
        .send({ title: 'Bai da cap nhat', content: '# Mới' });
      expect(res.status).toBe(200);
      const body = res.body as ArticleBody;
      expect(body.title).toBe('Bai da cap nhat');
      expect(body.slug).toBe('bai-da-cap-nhat');
    });
  });

  // ── DELETE /:slug — xóa ──────────────────────────────────────────────────
  describe('DELETE /:slug', () => {
    it('xóa thành công → 204; GET lại → 404', async () => {
      await request(app)
        .post('/api/articles')
        .send({ title: 'Bai se xoa', content: '# Nội dung' });
      const del = await request(app).delete('/api/articles/bai-se-xoa');
      expect(del.status).toBe(204);
      const get = await request(app).get('/api/articles/bai-se-xoa');
      expect(get.status).toBe(404);
    });
  });
});
