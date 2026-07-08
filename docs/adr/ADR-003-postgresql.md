# ADR-003 — Chọn PostgreSQL 16 làm Cơ sở dữ liệu

## Trạng thái (Status)

**Accepted** — 2026-06-28

---

## Bối cảnh (Context)

Mini-Wiki có 2 yêu cầu đặc thù với cơ sở dữ liệu:

1. **Full-Text Search (FTS — Tìm kiếm Toàn văn):** Tìm kiếm trong cả `title` lẫn `content` bài viết theo từ khóa (FR-12, FR-13). FTS khác `LIKE '%keyword%'` ở chỗ: FTS tách từ, loại bỏ stop word, hỗ trợ ranking kết quả — nhanh hơn và chính xác hơn nhiều ở tập dữ liệu lớn.
2. **Quan hệ nhiều-nhiều (Article ↔ Tag):** Cần DB quan hệ hỗ trợ foreign key, join, và constraint (ON DELETE CASCADE / RESTRICT).

---

## Các lựa chọn (Options)

| Phương án | Mô tả | Dẫn chứng |
|---|---|---|
| **PostgreSQL 16** ✅ | Relational DB mạnh nhất open-source; FTS built-in (GIN index) | 51% devs dùng (Stack Overflow 2024, #1 vượt MySQL); GIN index tìm kiếm toàn văn cực nhanh |
| MySQL 8 | Relational DB phổ biến, FTS có nhưng yếu hơn | 40% devs; FTS MySQL 8 cơ bản, thiếu advanced features như `ts_rank`; ecosystem Prisma hỗ trợ tốt |
| SQLite | Embedded DB, file-based, zero-config | Tuyệt vời cho dev local nhưng: không hỗ trợ `to_tsvector` GIN FTS; concurrent write lock toàn file; không phù hợp production |

---

## Quyết định (Decision)

Chọn **PostgreSQL 16** vì:

1. **FTS built-in, không cần service ngoài:** `to_tsvector('simple', title || ' ' || content)` + GIN index → tìm kiếm dưới 500ms ngay trong DB, không cần Elasticsearch hay Meilisearch (thêm complexity).
2. **`'simple'` dictionary cho tiếng Việt:** PostgreSQL không có dictionary `'vietnamese'` built-in, nhưng `'simple'` (lowercase + remove whitespace, không stemming) hoạt động tốt cho tìm kiếm cơ bản tiếng Việt không dấu. Đủ dùng cho v1.
3. **Constraint đầy đủ:** UNIQUE, FK, ON DELETE CASCADE/RESTRICT — đảm bảo tính toàn vẹn dữ liệu ngay ở tầng DB, không chỉ application.
4. **Chuẩn mực industry:** PostgreSQL là DB mặc định của Railway (platform deploy), Supabase, Neon — người học học PostgreSQL là học thứ sẽ gặp ở công việc thật.

---

## Hệ quả (Consequences)

### Tích cực
- GIN index (`idx_articles_fts`) cho phép FTS đáp ứng NFR-1 (< 500ms với < 1.000 bài viết).
- UNIQUE constraint trên `slug` ở tầng DB đảm bảo FR-6 (chặn slug trùng) ngay cả khi có concurrent request.
- ON DELETE RESTRICT trên `tag_id` trong `article_tags` enforces FR-9 (không xóa tag đang dùng) ở DB layer.
- Docker Compose dùng `postgres:16-alpine` image chính thức — dev/prod parity (NFR-6).

### Đánh đổi (Trade-offs)
- Setup phức tạp hơn SQLite (cần Docker hoặc cài local) — nhưng Docker Compose đã xử lý vấn đề này.
- `'simple'` dictionary không hỗ trợ stemming tiếng Việt (ví dụ: "lập trình viên" không tự expand ra "lập trình") — người dùng cần gõ đúng từ khóa. Chấp nhận được ở v1; v2 có thể dùng `unaccent` extension.
- PostgreSQL RAM footprint lớn hơn SQLite/MySQL khi idle — Railway free tier vẫn đủ.

---

> **GIN Index (Generalized Inverted Index):** Kiểu index PostgreSQL chuyên dùng cho dữ liệu có nhiều giá trị trong một ô (mảng, tsvector). GIN map ngược từ mỗi từ → danh sách row chứa từ đó, giúp tìm kiếm toàn văn cực nhanh so với B-Tree index thông thường.

---

> **Xem thêm:** [ADR-001](ADR-001-techstack.md) — Tech Stack tổng thể · [ADR-004](ADR-004-migrate-drizzle.md) — Chọn ORM (Drizzle, thay thế ADR-002)
