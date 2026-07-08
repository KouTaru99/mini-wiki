import { count, eq } from 'drizzle-orm';
import { db, pool } from '../lib/db.js';
import { articles, articleTags, tags } from './schema.js';
import { toSlug } from '../lib/slug.js';

// ── Dữ liệu mẫu ───────────────────────────────────────────────────────────────

const TAGS = [
  { name: 'JavaScript', slug: 'javascript' },
  { name: 'Git',        slug: 'git'        },
  { name: 'DevOps',     slug: 'devops'     },
  { name: 'PostgreSQL', slug: 'postgresql' },
] as const;

type TagSlug = (typeof TAGS)[number]['slug'];

const ARTICLES: Array<{
  title: string;
  content: string;
  publishedAt: Date;
  tags: TagSlug[];
}> = [
  {
    title: 'Bắt đầu với Git: Quản lý phiên bản cho người mới',
    content: `## Git là gì?

**Git** là hệ thống quản lý phiên bản phân tán (Distributed Version Control System — DVCS) do Linus Torvalds tạo ra năm 2005. Mọi lập trình viên đều cần Git để theo dõi thay đổi code và cộng tác nhóm.

## Các lệnh cơ bản

\`\`\`bash
git init                     # Khởi tạo repo mới trong thư mục hiện tại
git clone <url>              # Sao chép repo từ remote về máy
git add .                    # Stage toàn bộ thay đổi
git commit -m "mô tả ngắn"  # Lưu snapshot tại thời điểm hiện tại
git push origin main         # Đẩy commit lên remote
git pull                     # Kéo cập nhật mới nhất từ remote
\`\`\`

## Branching — Làm việc song song

Nhánh (branch) giúp bạn thêm tính năng mà không ảnh hưởng code ổn định trên \`main\`:

\`\`\`bash
git checkout -b feature/login   # Tạo + chuyển sang nhánh mới
git merge feature/login         # Gộp nhánh vào nhánh hiện tại
git branch -d feature/login     # Xóa nhánh đã merge
\`\`\`

## Quy tắc commit tốt

- Dòng đầu ≤ 72 ký tự, dùng động từ hiện tại: *"Add login page"* không phải *"Added..."*
- Giải thích **lý do** thay đổi, không chỉ **cái gì** thay đổi.
`,
    publishedAt: new Date('2026-06-10T07:00:00.000Z'),
    tags: ['git'],
  },
  {
    title: 'JavaScript cơ bản: Biến, Hàm và Đối tượng',
    content: `## Biến (Variable)

JavaScript có 3 cách khai báo biến với phạm vi (scope) khác nhau:

\`\`\`js
const PI = 3.14;       // Không thể gán lại — dùng mặc định
let count = 0;         // Có thể gán lại — dùng khi cần thay đổi
var legacy = 'cũ';    // Tránh dùng — var bị hoisting gây nhầm lẫn
\`\`\`

## Hàm (Function)

\`\`\`js
// Hàm truyền thống — có tên riêng trong stack trace
function greet(name) {
  return \`Xin chào, \${name}!\`;
}

// Arrow function — cú pháp ngắn gọn, không có 'this' riêng
const double = (n) => n * 2;

// Hàm async/await — xử lý bất đồng bộ
async function fetchArticle(slug) {
  const res = await fetch(\`/api/articles/\${slug}\`);
  return res.json();
}
\`\`\`

## Đối tượng (Object)

\`\`\`js
const article = {
  id: 1,
  title: 'JavaScript cơ bản',
  tags: ['javascript'],
  isPublished: true,
};

// Destructuring — lấy nhanh thuộc tính
const { title, tags } = article;

// Spread operator — sao chép + ghi đè
const updated = { ...article, title: 'JS nâng cao' };
\`\`\`

## Array methods quan trọng

\`\`\`js
const nums = [1, 2, 3, 4, 5];

nums.map((n) => n * 2);        // [2, 4, 6, 8, 10]
nums.filter((n) => n % 2 === 0); // [2, 4]
nums.reduce((acc, n) => acc + n, 0); // 15
\`\`\`
`,
    publishedAt: new Date('2026-06-15T07:00:00.000Z'),
    tags: ['javascript'],
  },
  {
    title: 'PostgreSQL và Drizzle: Làm việc với cơ sở dữ liệu trong Node.js',
    content: `## Drizzle là gì?

**Drizzle** là ORM (Object-Relational Mapper — ánh xạ đối tượng-quan hệ) cho Node.js và TypeScript, theo triết lý "thin layer over SQL": schema và query đều viết bằng TypeScript thuần — không có bước sinh code (code generation) riêng, không có engine binary nào phải tải về.

## Định nghĩa Schema

\`\`\`ts
import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const articles = pgTable('articles', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
});
\`\`\`

## Truy vấn với Drizzle

\`\`\`ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { desc, eq, isNotNull } from 'drizzle-orm';
import { Pool } from 'pg';
import { articles } from './schema';

const db = drizzle({ client: new Pool({ connectionString: process.env.DATABASE_URL }) });

// Lấy tất cả bài viết đã đăng
const rows = await db
  .select()
  .from(articles)
  .where(isNotNull(articles.publishedAt))
  .orderBy(desc(articles.publishedAt));

// Tìm theo slug
const [article] = await db.select().from(articles).where(eq(articles.slug, 'bat-dau-voi-git'));

// Tạo bài viết mới
const [newArticle] = await db
  .insert(articles)
  .values({ title: 'Tiêu đề', slug: 'tieu-de', content: '...' })
  .returning();
\`\`\`

## Full-Text Search với PostgreSQL GIN Index

Tính năng của **PostgreSQL**, không phụ thuộc ORM nào cả:

\`\`\`sql
-- Tạo GIN index trên cột tìm kiếm
CREATE INDEX idx_articles_fts ON articles
  USING gin(to_tsvector('simple', title || ' ' || content));

-- Truy vấn FTS
SELECT * FROM articles
WHERE to_tsvector('simple', title || ' ' || content)
      @@ plainto_tsquery('simple', 'git co ban');
\`\`\`

## Vì sao đổi từ Prisma sang Drizzle?

Dự án ban đầu chọn Prisma, nhưng đổi sang Drizzle sau khi phát hiện Prisma luôn cần tải **engine binary** từ 1 domain riêng (\`binaries.prisma.sh\`) — bị proxy mạng doanh nghiệp chặn ngay cả khi các nguồn quen thuộc (npm, Docker Hub, GitHub) vẫn thông bình thường. Drizzle không có bước tải binary nào — 100% TypeScript, loại bỏ hẳn lớp rủi ro đó. Xem ADR ghi lại quyết định này trong \`docs/adr/\`.
`,
    publishedAt: new Date('2026-06-20T07:00:00.000Z'),
    tags: ['postgresql', 'javascript'],
  },
];

// ── Hàm seed chính ────────────────────────────────────────────────────────────

async function main() {
  console.log('Bắt đầu seed dữ liệu...\n');

  // 1. Upsert tags — slug là unique key
  const tagMap = new Map<TagSlug, number>();
  for (const tagData of TAGS) {
    const [tag] = await db
      .insert(tags)
      .values(tagData)
      .onConflictDoUpdate({ target: tags.slug, set: { name: tagData.name } })
      .returning();
    tagMap.set(tagData.slug, tag.id);
    console.log(`  ✓ Tag: "${tag.name}" (id=${tag.id})`);
  }

  // 2. Upsert articles — slug sinh từ title
  for (const data of ARTICLES) {
    const slug = toSlug(data.title);

    const [article] = await db
      .insert(articles)
      .values({ title: data.title, slug, content: data.content, publishedAt: data.publishedAt })
      .onConflictDoUpdate({
        target: articles.slug,
        set: {
          title: data.title,
          content: data.content,
          publishedAt: data.publishedAt,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Thay thế toàn bộ liên kết tag (xóa cũ → tạo mới) để idempotent
    await db.delete(articleTags).where(eq(articleTags.articleId, article.id));
    const tagIds = data.tags
      .map((tagSlug) => tagMap.get(tagSlug))
      .filter((id): id is number => id !== undefined);
    if (tagIds.length > 0) {
      await db.insert(articleTags).values(tagIds.map((tagId) => ({ articleId: article.id, tagId })));
    }

    console.log(
      `  ✓ Bài viết: "${article.title}"\n    slug=${article.slug} | tags=[${data.tags.join(', ')}]`,
    );
  }

  // 3. Tổng kết
  const [[{ tagCount }], [{ articleCount }]] = await Promise.all([
    db.select({ tagCount: count() }).from(tags),
    db.select({ articleCount: count() }).from(articles),
  ]);
  console.log(`\nSeed hoàn tất: ${tagCount} tag, ${articleCount} bài viết.`);
}

main()
  .catch((err: unknown) => {
    console.error('Seed thất bại:', err);
    process.exit(1);
  })
  .finally(() => pool.end());
