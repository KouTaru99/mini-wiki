import type { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import { toSlug } from '../lib/slug.js';

function formatTag(t: { id: number; name: string; slug: string; createdAt: Date }) {
  return { id: t.id, name: t.name, slug: t.slug, created_at: t.createdAt };
}

// T1 — GET /api/tags
export async function list(_req: Request, res: Response) {
  const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
  res.json(tags.map(formatTag));
}

// T2 — POST /api/tags
export async function create(req: Request, res: Response) {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) throw new AppError(400, 'MISSING_FIELD', "Trường 'name' là bắt buộc.");

  const tag = await prisma.tag.create({ data: { name, slug: toSlug(name) } });
  res.status(201).json(formatTag(tag));
}

// T3 — DELETE /api/tags/:id
export async function remove(req: Request, res: Response) {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) throw new AppError(400, 'INVALID_TYPE', "Tham số 'id' phải là số nguyên.");

  const tag = await prisma.tag.findUnique({
    where: { id },
    include: { _count: { select: { articles: true } } },
  });
  if (!tag) throw new AppError(404, 'TAG_NOT_FOUND', `Không tìm thấy tag với id ${id}.`);

  // Kiểm trước khi xóa để trả message rõ số bài còn gắn (thay vì để DB ném P2003)
  if (tag._count.articles > 0) {
    throw new AppError(
      409,
      'TAG_IN_USE',
      `Tag còn gắn ${tag._count.articles} bài viết, không thể xóa.`,
    );
  }

  await prisma.tag.delete({ where: { id } });
  res.status(204).send();
}
