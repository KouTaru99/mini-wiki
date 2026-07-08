import { eq, inArray } from 'drizzle-orm';
import { db } from './db.js';
import { articleTags, tags } from '../db/schema.js';

export type TagSummary = { id: number; name: string; slug: string };

// Batch-load tags cho nhiều article cùng lúc — tránh N+1 query.
export async function loadTagsForArticles(
  articleIds: number[],
): Promise<Map<number, TagSummary[]>> {
  const tagMap = new Map<number, TagSummary[]>();
  if (articleIds.length === 0) return tagMap;

  const rows = await db
    .select({
      articleId: articleTags.articleId,
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(articleTags)
    .innerJoin(tags, eq(articleTags.tagId, tags.id))
    .where(inArray(articleTags.articleId, articleIds));

  for (const row of rows) {
    const list = tagMap.get(row.articleId) ?? [];
    list.push({ id: row.id, name: row.name, slug: row.slug });
    tagMap.set(row.articleId, list);
  }
  return tagMap;
}
