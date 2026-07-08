import type { Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { AppError } from '../middleware/errorHandler.js';
import { db } from '../lib/db.js';
import { loadTagsForArticles } from '../lib/articleTags.js';

type RawArticleRow = { id: number; title: string; slug: string; published_at: Date | null };

// S1 — GET /api/search?q=&page=&limit=
export async function search(req: Request, res: Response) {
  const q = (req.query.q as string | undefined)?.trim();
  if (!q) throw new AppError(400, 'QUERY_REQUIRED', "Tham số 'q' là bắt buộc.");

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  // sql`` tham số hoá ${q}, ${limit}, ${offset} — KHÔNG nối chuỗi, tránh SQL injection.
  // GIN index trên to_tsvector('simple', title || ' ' || content) tăng tốc tra cứu FTS.
  const [rowsResult, countResult] = await Promise.all([
    db.execute<RawArticleRow>(sql`
      SELECT id, title, slug, published_at
      FROM articles
      WHERE to_tsvector('simple', title || ' ' || content) @@ plainto_tsquery('simple', ${q})
      ORDER BY published_at DESC NULLS LAST, id DESC
      LIMIT ${limit} OFFSET ${offset}
    `),
    db.execute<{ count: string }>(sql`
      SELECT COUNT(*) AS count
      FROM articles
      WHERE to_tsvector('simple', title || ' ' || content) @@ plainto_tsquery('simple', ${q})
    `),
  ]);

  const rows = rowsResult.rows;
  const total = Number(countResult.rows[0]?.count ?? 0);

  // Lấy tags theo batch — tránh N+1 query
  const tagMap = await loadTagsForArticles(rows.map((r) => r.id));

  const data = rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    published_at: r.published_at,
    tags: tagMap.get(r.id) ?? [],
  }));

  res.json({ data, meta: { total, page, limit, query: q } });
}
