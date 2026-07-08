// Drizzle Schema — Mini-Wiki v1
// Tài liệu: https://orm.drizzle.team/docs/sql-schema-declaration
// Sau khi sửa file này: chạy `npm run db:generate` để sinh migration SQL.

import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

// ─── articles (Bài viết) ────────────────────────────────────────────────────
export const articles = pgTable(
  'articles',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    content: text('content').notNull(),
    // NULL = bản nháp; có giá trị = đã đăng
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // GIN index cho full-text search (dictionary 'simple' — Postgres không có
    // dictionary tiếng Việt built-in; 'simple' đủ cho v1).
    index('idx_articles_fts').using(
      'gin',
      sql`to_tsvector('simple', ${table.title} || ' ' || ${table.content})`,
    ),
  ],
);

// ─── tags (Nhãn) ─────────────────────────────────────────────────────────────
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── article_tags (Bảng nối nhiều-nhiều Article ↔ Tag) ───────────────────────
export const articleTags = pgTable(
  'article_tags',
  {
    articleId: integer('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'restrict' }),
  },
  (table) => [primaryKey({ columns: [table.articleId, table.tagId] })],
);
