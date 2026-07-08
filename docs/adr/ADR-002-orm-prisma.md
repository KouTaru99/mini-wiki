# ADR-002 — Chọn Prisma 5 làm ORM

## Trạng thái (Status)

**⚠️ Superseded** — 2026-07-08, bởi [ADR-004](ADR-004-migrate-drizzle.md) (đổi sang Drizzle ORM: Prisma cần tải native binary từ domain riêng, bị proxy mạng doanh nghiệp chặn). Nội dung bên dưới giữ nguyên làm hồ sơ quyết định gốc, không còn phản ánh trạng thái hiện tại của dự án.

~~Accepted — 2026-06-28~~

---

## Bối cảnh (Context)

Ứng dụng cần tầng truy cập cơ sở dữ liệu (data access layer) để tương tác với PostgreSQL. Có 4 hướng phổ biến trong hệ sinh thái Node.js: ORM đầy đủ, query builder, ORM schema-first, và raw SQL.

**ORM (Object-Relational Mapper — Ánh xạ Quan hệ-Đối tượng):** Thư viện trung gian dịch giữa model TypeScript (object) và bảng SQL (relation), giúp lập trình viên viết code TypeScript thay vì SQL thuần — đồng thời cung cấp type-safety và migration tự động.

---

## Các lựa chọn (Options)

| Phương án | Mô tả | Dẫn chứng |
|---|---|---|
| **Prisma 5** ✅ | Schema-first ORM: định nghĩa model trong `schema.prisma`, tự sinh TypeScript client | ~40k ⭐ GitHub; type-safe 100%; migration git-tracked; DX (Developer Experience) tốt nhất nhóm |
| Drizzle ORM | Query builder + type-safe, schema viết bằng TypeScript | ~28k ⭐; linh hoạt hơn nhưng verbose hơn; migration tooling còn mới |
| TypeORM | ORM truyền thống, decorator-based | ~34k ⭐; mature nhưng type-safety kém hơn Prisma; nhiều lỗi runtime ẩn |
| Raw `pg` (node-postgres) | Driver PostgreSQL thuần, viết SQL trực tiếp | Kiểm soát tuyệt đối nhưng không type-safe; migration phải tự quản lý; không phù hợp cho mục đích dạy học |

---

## Quyết định (Decision)

Chọn **Prisma 5** với lý do:

1. **Schema là artifact đọc được:** File `schema.prisma` mô tả toàn bộ cấu trúc DB bằng DSL (Domain-Specific Language) ngắn gọn — người học đọc 1 file là hiểu ngay toàn bộ data model.
2. **Migration git-tracked:** Mỗi thay đổi schema sinh ra file SQL migration trong `api/prisma/migrations/` → team track lịch sử thay đổi DB qua git, review được trước khi apply.
3. **Type-safe client tự sinh:** `@prisma/client` tự sinh dựa trên schema → IDE autocomplete đầy đủ, compiler bắt lỗi sai trường/kiểu trước khi chạy.
4. **Phù hợp mục đích dạy:** Người học thấy rõ quan hệ: `schema.prisma` → migration SQL → TypeScript types. Chuỗi này minh bạch hơn bất kỳ phương án nào.

---

## Hệ quả (Consequences)

### Tích cực
- Một nguồn sự thật duy nhất (`schema.prisma`) cho cả DB schema lẫn TypeScript types.
- `prisma migrate deploy` trong CI/CD tự động áp migration an toàn.
- Prisma Studio (GUI) giúp debug data trực quan mà không cần viết query.
- Quan hệ nhiều-nhiều (Article ↔ Tag qua `article_tags`) được Prisma biểu diễn rõ ràng qua model `ArticleTag`.

### Đánh đổi (Trade-offs)
- Prisma generate client → mỗi lần thay schema cần chạy `prisma generate` (thêm 1 bước, dễ quên).
- Với query phức tạp (nested aggregation, window function), Prisma đôi khi cần `$queryRaw` để escape xuống SQL thuần.
- Bundle size của `@prisma/client` lớn hơn raw `pg` — không thành vấn đề với server-side app (chỉ quan trọng ở browser bundle).

---

> **Xem thêm:** [ADR-001](ADR-001-techstack.md) — Tech Stack tổng thể · [ADR-003](ADR-003-postgresql.md) — Chọn PostgreSQL
