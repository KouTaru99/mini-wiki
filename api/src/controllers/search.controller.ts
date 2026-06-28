import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';

type RawArticleRow = { id: number; title: string; slug: string; published_at: Date | null };
type TagSummary = { id: number; name: string; slug: string };

// S1 — GET /api/search?q=&page=&limit=
export async function search(req: Request, res: Response) {
  const q = (req.query.q as string | undefined)?.trim();
  if (!q) throw new AppError(400, 'QUERY_REQUIRED', "Tham số 'q' là bắt buộc.");

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  // Prisma.sql tham số hoá ${q}, ${limit}, ${offset} — KHÔNG nối chuỗi, tránh SQL injection.
  // GIN index trên to_tsvector('simple', title || ' ' || content) tăng tốc tra cứu FTS.
  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<RawArticleRow[]>(Prisma.sql`
      SELECT id, title, slug, published_at
      FROM articles
      WHERE to_tsvector('simple', title || ' ' || content) @@ plainto_tsquery('simple', ${q})
      ORDER BY published_at DESC NULLS LAST, id DESC
      LIMIT ${limit} OFFSET ${offset}
    `),
    prisma.$queryRaw<[{ count: bigint }]>(Prisma.sql`
      SELECT COUNT(*) AS count
      FROM articles
      WHERE to_tsvector('simple', title || ' ' || content) @@ plainto_tsquery('simple', ${q})
    `),
  ]);

  const total = Number(countRows[0]?.count ?? 0);

  // Lấy tags theo batch — tránh N+1 query
  const articleIds = rows.map(r => r.id);
  const tagMap = new Map<number, TagSummary[]>();

  if (articleIds.length > 0) {
    const atRows = await prisma.articleTag.findMany({
      where: { articleId: { in: articleIds } },
      include: { tag: { select: { id: true, name: true, slug: true } } },
    });
    for (const at of atRows) {
      const list = tagMap.get(at.articleId) ?? [];
      list.push({ id: at.tag.id, name: at.tag.name, slug: at.tag.slug });
      tagMap.set(at.articleId, list);
    }
  }

  const data = rows.map(r => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    published_at: r.published_at,
    tags: tagMap.get(r.id) ?? [],
  }));

  res.json({ data, meta: { total, page, limit, query: q } });
}
