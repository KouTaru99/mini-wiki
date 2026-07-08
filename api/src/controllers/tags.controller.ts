import type { Request, Response } from 'express';
import { asc, count, eq } from 'drizzle-orm';
import { AppError } from '../middleware/errorHandler.js';
import { db } from '../lib/db.js';
import { articleTags, tags } from '../db/schema.js';
import { toSlug } from '../lib/slug.js';

function formatTag(t: { id: number; name: string; slug: string; createdAt: Date }) {
  return { id: t.id, name: t.name, slug: t.slug, created_at: t.createdAt };
}

// T1 — GET /api/tags
export async function list(_req: Request, res: Response) {
  const rows = await db.select().from(tags).orderBy(asc(tags.name));
  res.json(rows.map(formatTag));
}

// T2 — POST /api/tags
export async function create(req: Request, res: Response) {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) throw new AppError(400, 'MISSING_FIELD', "Trường 'name' là bắt buộc.");

  const [tag] = await db.insert(tags).values({ name, slug: toSlug(name) }).returning();
  res.status(201).json(formatTag(tag));
}

// T3 — DELETE /api/tags/:id
export async function remove(req: Request, res: Response) {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) throw new AppError(400, 'INVALID_TYPE', "Tham số 'id' phải là số nguyên.");

  const [tag] = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  if (!tag) throw new AppError(404, 'TAG_NOT_FOUND', `Không tìm thấy tag với id ${id}.`);

  // Kiểm trước khi xóa để trả message rõ số bài còn gắn (thay vì để DB ném lỗi FK)
  const [{ articleCount }] = await db
    .select({ articleCount: count() })
    .from(articleTags)
    .where(eq(articleTags.tagId, id));

  if (articleCount > 0) {
    throw new AppError(
      409,
      'TAG_IN_USE',
      `Tag còn gắn ${articleCount} bài viết, không thể xóa.`,
    );
  }

  await db.delete(tags).where(eq(tags.id, id));
  res.status(204).send();
}
