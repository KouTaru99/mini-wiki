import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import { toSlug } from '../lib/slug.js';
import { renderMarkdown } from '../lib/markdown.js';

// include chuẩn để lấy tags lồng nhau cho mọi query Article
const ARTICLE_INCLUDE = { tags: { include: { tag: true } } } as const;

type ArticleWithTags = Prisma.ArticleGetPayload<{ include: typeof ARTICLE_INCLUDE }>;

function mapTags(tags: ArticleWithTags['tags']) {
  return tags.map(at => ({ id: at.tag.id, name: at.tag.name, slug: at.tag.slug }));
}

// Format đầy đủ — dùng ở GET /:slug, POST, PUT (có content + content_html tuỳ chọn)
function formatArticle(a: ArticleWithTags, contentHtml?: string) {
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    content: a.content,
    ...(contentHtml !== undefined && { content_html: contentHtml }),
    published_at: a.publishedAt,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
    tags: mapTags(a.tags),
  };
}

// Format rút gọn — dùng ở GET / (danh sách, không có content để giảm payload)
function formatListItem(a: ArticleWithTags) {
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    published_at: a.publishedAt,
    tags: mapTags(a.tags),
  };
}

// A1 — GET /api/articles
export async function list(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const tagSlug = req.query.tag as string | undefined;

  const where: Prisma.ArticleWhereInput = tagSlug
    ? { tags: { some: { tag: { slug: tagSlug } } } }
    : {};

  const [total, articles] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      orderBy: [
        { publishedAt: { sort: 'desc', nulls: 'last' } },
        { id: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
      include: ARTICLE_INCLUDE,
    }),
  ]);

  res.json({ data: articles.map(formatListItem), meta: { total, page, limit } });
}

// A3 — GET /api/articles/:slug
export async function getBySlug(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const article = await prisma.article.findUnique({
    where: { slug },
    include: ARTICLE_INCLUDE,
  });
  if (!article) {
    throw new AppError(
      404,
      'ARTICLE_NOT_FOUND',
      `Không tìm thấy bài viết với slug '${slug}'.`,
    );
  }
  const contentHtml = await renderMarkdown(article.content);
  res.json(formatArticle(article, contentHtml));
}

// A2 — POST /api/articles
export async function create(req: Request, res: Response) {
  const { title, content, published_at, tagIds } = req.body as {
    title?: string;
    content?: string;
    published_at?: string | null;
    tagIds?: number[];
  };

  if (!title?.trim()) throw new AppError(400, 'MISSING_FIELD', "Trường 'title' là bắt buộc.");
  if (!content?.trim()) throw new AppError(400, 'MISSING_FIELD', "Trường 'content' là bắt buộc.");

  const article = await prisma.article.create({
    data: {
      title,
      slug: toSlug(title),
      content,
      publishedAt: published_at ? new Date(published_at) : null,
      tags: tagIds?.length ? { create: tagIds.map(tagId => ({ tagId })) } : undefined,
    },
    include: ARTICLE_INCLUDE,
  });

  res.status(201).json(formatArticle(article));
}

// A4 — PUT /api/articles/:slug
export async function update(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const existing = await prisma.article.findUnique({ where: { slug } });
  if (!existing) {
    throw new AppError(
      404,
      'ARTICLE_NOT_FOUND',
      `Không tìm thấy bài viết với slug '${slug}'.`,
    );
  }

  const body = req.body as {
    title?: string;
    content?: string;
    published_at?: string | null;
    tagIds?: number[];
  };

  const data: Prisma.ArticleUpdateInput = {};
  if (body.title !== undefined) {
    data.title = body.title;
    data.slug = toSlug(body.title);
  }
  if (body.content !== undefined) data.content = body.content;
  // Dùng 'in' để phân biệt "field không gửi" vs "field gửi lên null" (bản nháp)
  if ('published_at' in body) {
    data.publishedAt = body.published_at ? new Date(body.published_at) : null;
  }
  if (body.tagIds !== undefined) {
    // Thay toàn bộ: xóa ArticleTag cũ rồi tạo lại
    data.tags = { deleteMany: {}, create: body.tagIds.map(tagId => ({ tagId })) };
  }

  const article = await prisma.article.update({
    where: { id: existing.id },
    data,
    include: ARTICLE_INCLUDE,
  });

  res.json(formatArticle(article));
}

// A5 — DELETE /api/articles/:slug
export async function remove(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const existing = await prisma.article.findUnique({ where: { slug } });
  if (!existing) {
    throw new AppError(
      404,
      'ARTICLE_NOT_FOUND',
      `Không tìm thấy bài viết với slug '${slug}'.`,
    );
  }
  // ArticleTag tự xóa cascade (onDelete: Cascade ở schema)
  await prisma.article.delete({ where: { id: existing.id } });
  res.status(204).send();
}
