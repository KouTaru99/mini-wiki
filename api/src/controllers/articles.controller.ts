import type { Request, Response } from 'express';
import { count, desc, eq, inArray, sql } from 'drizzle-orm';
import { AppError } from '../middleware/errorHandler.js';
import { db } from '../lib/db.js';
import { articles, articleTags, tags } from '../db/schema.js';
import { loadTagsForArticles, type TagSummary } from '../lib/articleTags.js';
import { toSlug } from '../lib/slug.js';
import { renderMarkdown } from '../lib/markdown.js';

type ArticleRow = typeof articles.$inferSelect;

// Format đầy đủ — dùng ở GET /:slug, POST, PUT (có content + content_html tuỳ chọn)
function formatArticle(a: ArticleRow, tagList: TagSummary[], contentHtml?: string) {
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    content: a.content,
    ...(contentHtml !== undefined && { content_html: contentHtml }),
    published_at: a.publishedAt,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
    tags: tagList,
  };
}

// Format rút gọn — dùng ở GET / (danh sách, không có content để giảm payload)
function formatListItem(a: ArticleRow, tagList: TagSummary[]) {
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    published_at: a.publishedAt,
    tags: tagList,
  };
}

// A1 — GET /api/articles
export async function list(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const tagSlug = req.query.tag as string | undefined;

  const where = tagSlug
    ? inArray(
        articles.id,
        db
          .select({ id: articleTags.articleId })
          .from(articleTags)
          .innerJoin(tags, eq(articleTags.tagId, tags.id))
          .where(eq(tags.slug, tagSlug)),
      )
    : undefined;

  const [totalRow, rows] = await Promise.all([
    db.select({ value: count() }).from(articles).where(where),
    db
      .select()
      .from(articles)
      .where(where)
      // NULLS LAST không có helper riêng trong Drizzle — dùng sql`` cho đúng thứ tự gốc.
      .orderBy(sql`${articles.publishedAt} DESC NULLS LAST`, desc(articles.id))
      .limit(limit)
      .offset((page - 1) * limit),
  ]);

  const tagMap = await loadTagsForArticles(rows.map((r) => r.id));

  res.json({
    data: rows.map((a) => formatListItem(a, tagMap.get(a.id) ?? [])),
    meta: { total: totalRow[0]?.value ?? 0, page, limit },
  });
}

// A3 — GET /api/articles/:slug
export async function getBySlug(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const [article] = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
  if (!article) {
    throw new AppError(
      404,
      'ARTICLE_NOT_FOUND',
      `Không tìm thấy bài viết với slug '${slug}'.`,
    );
  }
  const tagMap = await loadTagsForArticles([article.id]);
  const contentHtml = await renderMarkdown(article.content);
  res.json(formatArticle(article, tagMap.get(article.id) ?? [], contentHtml));
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

  const article = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(articles)
      .values({
        title,
        slug: toSlug(title),
        content,
        publishedAt: published_at ? new Date(published_at) : null,
      })
      .returning();

    if (tagIds?.length) {
      await tx.insert(articleTags).values(tagIds.map((tagId) => ({ articleId: inserted.id, tagId })));
    }
    return inserted;
  });

  const tagMap = await loadTagsForArticles([article.id]);
  res.status(201).json(formatArticle(article, tagMap.get(article.id) ?? []));
}

// A4 — PUT /api/articles/:slug
export async function update(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const [existing] = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
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

  const data: Partial<typeof articles.$inferInsert> = { updatedAt: new Date() };
  if (body.title !== undefined) {
    data.title = body.title;
    data.slug = toSlug(body.title);
  }
  if (body.content !== undefined) data.content = body.content;
  // Dùng 'in' để phân biệt "field không gửi" vs "field gửi lên null" (bản nháp)
  if ('published_at' in body) {
    data.publishedAt = body.published_at ? new Date(body.published_at) : null;
  }

  const article = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(articles)
      .set(data)
      .where(eq(articles.id, existing.id))
      .returning();

    if (body.tagIds !== undefined) {
      // Thay toàn bộ: xóa ArticleTag cũ rồi tạo lại
      await tx.delete(articleTags).where(eq(articleTags.articleId, existing.id));
      if (body.tagIds.length > 0) {
        await tx
          .insert(articleTags)
          .values(body.tagIds.map((tagId) => ({ articleId: existing.id, tagId })));
      }
    }
    return updated;
  });

  const tagMap = await loadTagsForArticles([article.id]);
  res.json(formatArticle(article, tagMap.get(article.id) ?? []));
}

// A5 — DELETE /api/articles/:slug
export async function remove(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const [existing] = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
  if (!existing) {
    throw new AppError(
      404,
      'ARTICLE_NOT_FOUND',
      `Không tìm thấy bài viết với slug '${slug}'.`,
    );
  }
  // article_tags tự xóa cascade (onDelete: 'cascade' ở schema)
  await db.delete(articles).where(eq(articles.id, existing.id));
  res.status(204).send();
}
