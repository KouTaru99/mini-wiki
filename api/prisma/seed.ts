import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Chuyển tiêu đề tiếng Việt → slug ASCII (bỏ dấu + thay khoảng trắng = '-')
function slugify(text: string): string {
  return text
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu tổ hợp
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

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
    title: 'PostgreSQL và Prisma: Làm việc với cơ sở dữ liệu trong Node.js',
    content: `## Prisma là gì?

**Prisma** là ORM (Object-Relational Mapper — ánh xạ đối tượng-quan hệ) thế hệ mới cho Node.js và TypeScript. Thay vì viết SQL thủ công, bạn định nghĩa schema bằng **Prisma Schema Language**, rồi Prisma tự sinh:
- TypeScript types an toàn kiểu (type-safe)
- Query builder thông minh với autocomplete

## Định nghĩa Schema

\`\`\`prisma
model Article {
  id          Int       @id @default(autoincrement())
  title       String    @db.VarChar(255)
  slug        String    @unique
  content     String
  publishedAt DateTime? @map("published_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  @@map("articles")
}
\`\`\`

## Truy vấn với Prisma Client

\`\`\`ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Lấy tất cả bài viết đã đăng
const articles = await prisma.article.findMany({
  where: { publishedAt: { not: null } },
  orderBy: { publishedAt: 'desc' },
});

// Tìm theo slug — ném lỗi P2025 nếu không thấy
const article = await prisma.article.findUniqueOrThrow({
  where: { slug: 'bat-dau-voi-git' },
  include: { tags: { include: { tag: true } } },
});

// Tạo bài viết mới
const newArticle = await prisma.article.create({
  data: { title: 'Tiêu đề', slug: 'tieu-de', content: '...' },
});
\`\`\`

## Full-Text Search với PostgreSQL GIN Index

PostgreSQL hỗ trợ tìm kiếm toàn văn bản (full-text search) cực nhanh nhờ **GIN index**:

\`\`\`sql
-- Tạo GIN index trên cột tìm kiếm
CREATE INDEX articles_fts_idx ON articles
  USING gin(to_tsvector('simple', title || ' ' || content));

-- Truy vấn FTS
SELECT * FROM articles
WHERE to_tsvector('simple', title || ' ' || content)
      @@ plainto_tsquery('simple', 'git co ban');
\`\`\`
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
    const tag = await prisma.tag.upsert({
      where:  { slug: tagData.slug },
      update: {},
      create: tagData,
    });
    tagMap.set(tagData.slug, tag.id);
    console.log(`  ✓ Tag: "${tag.name}" (id=${tag.id})`);
  }

  // 2. Upsert articles — slug sinh từ title
  for (const data of ARTICLES) {
    const slug = slugify(data.title);

    const article = await prisma.article.upsert({
      where:  { slug },
      update: {
        title:       data.title,
        content:     data.content,
        publishedAt: data.publishedAt,
      },
      create: {
        title:       data.title,
        slug,
        content:     data.content,
        publishedAt: data.publishedAt,
      },
    });

    // Thay thế toàn bộ liên kết tag (xóa cũ → tạo mới) để idempotent
    await prisma.articleTag.deleteMany({ where: { articleId: article.id } });
    for (const tagSlug of data.tags) {
      const tagId = tagMap.get(tagSlug);
      if (tagId !== undefined) {
        await prisma.articleTag.create({
          data: { articleId: article.id, tagId },
        });
      }
    }

    console.log(
      `  ✓ Bài viết: "${article.title}"\n    slug=${article.slug} | tags=[${data.tags.join(', ')}]`,
    );
  }

  // 3. Tổng kết
  const [tagCount, articleCount] = await Promise.all([
    prisma.tag.count(),
    prisma.article.count(),
  ]);
  console.log(`\nSeed hoàn tất: ${tagCount} tag, ${articleCount} bài viết.`);
}

main()
  .catch((err: unknown) => {
    console.error('Seed thất bại:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
