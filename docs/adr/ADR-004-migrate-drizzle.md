# ADR-004 — Đổi ORM từ Prisma sang Drizzle

## Trạng thái (Status)

**Accepted** — 2026-07-08 · Thay thế (supersedes) [ADR-002](ADR-002-orm-prisma.md)

---

## Bối cảnh (Context)

Một learner chạy Lab trong mạng doanh nghiệp báo lỗi: `prisma generate` (và `prisma migrate`) crash vì không tải được engine. Điều tra cho thấy nguyên nhân gốc:

Prisma có 1 phần lõi viết bằng Rust, biên dịch thành **native binary riêng** (query-engine + schema-engine) — tải về từ domain `binaries.prisma.sh` mỗi khi cần, **không đi qua npm registry**. Domain này không nằm trong nhóm "quen mặt" (npm, Docker Hub, GitHub) nên proxy công ty theo mô hình allowlist chặn thẳng bằng 403 — ngay cả khi đã cấu hình "offline", Prisma vẫn cố gọi ra ngoài để tải/kiểm checksum trước khi dùng engine, và bị chặn giữa chừng.

**Thử vá trước (không đạt):** vendor sẵn 2 file engine (tải từ máy không bị chặn) + trỏ Prisma dùng qua biến môi trường `PRISMA_QUERY_ENGINE_LIBRARY`/`PRISMA_SCHEMA_ENGINE_BINARY`. Cách này **chạy được** (verify bằng cách giả lập chặn domain thật, build qua trót lọt) nhưng chỉ là **workaround**, không giải quyết tận gốc:

- Vẫn phụ thuộc đúng 1 kiến trúc CPU cố định (Linux x86-64) — sai kiến trúc là vô dụng.
- Phải vá lại thủ công mỗi lần Prisma đổi version engine.
- Bản chất Prisma — **kể cả bản 7 mới nhất** — vẫn giữ 1 phần là native binary tải rời (`schema-engine`); rủi ro bị chặn domain lạ là **thuộc tính cố hữu** của Prisma, không phải lỗi cấu hình có thể vá dứt điểm.

→ Cần đổi sang công cụ **không có bước tải binary nào cả**, loại bỏ hẳn lớp rủi ro thay vì vá từng lần.

---

## Các lựa chọn (Options)

ADR-002 đã cân nhắc Drizzle nhưng chọn Prisma vì lúc đó Drizzle "linh hoạt hơn nhưng verbose hơn; migration tooling còn mới". Ràng buộc **mạng doanh nghiệp chặn theo domain-allowlist** không nằm trong phép so sánh gốc — khi thêm ràng buộc này, phép tính đổi chiều:

| Phương án | Có native binary tải rời? | Ghi chú |
|---|---|---|
| **Drizzle ORM** ✅ | **Không** — 100% TypeScript, `drizzle-kit` cũng thuần JS/TS | ~28k ⭐; migration tooling nay đã ổn định hơn thời điểm ADR-002 |
| Giữ Prisma + vendor engine vĩnh viễn | Có, nhưng đã vá | Nợ vận hành dài hạn: vá lại mỗi lần đổi version, chỉ đúng 1 kiến trúc CPU |
| TypeORM | Có (native `better-sqlite3`-style binding tùy driver) | Không giải quyết đúng vấn đề gốc |
| Raw `pg` + SQL thuần | Không | Mất type-safety hoàn toàn — không phù hợp mục đích dạy học (như ADR-002 đã loại) |

---

## Quyết định (Decision)

Chọn **Drizzle ORM** (`drizzle-orm` + `drizzle-kit`, driver `pg`/node-postgres):

1. **Zero native binary:** Không có bước "generate client" tải file nào cả — `src/db/schema.ts` viết bằng TypeScript thuần, import thẳng làm client, không codegen.
2. **`drizzle-kit generate` chỉ diff schema.ts → SQL migration** (không cần kết nối mạng ngoài, không cần DB sống) — khác hẳn cơ chế "tải engine" của Prisma.
3. **Vẫn type-safe + schema-as-code** — giữ đúng tinh thần ADR-002 (schema là artifact đọc được, migration git-tracked) mà không đánh đổi rủi ro mạng.
4. **Migration workflow minh bạch hơn cho mục đích dạy:** tách rõ 2 bước `db:generate` (sinh SQL, review được) → `migrate` (áp), thay vì 1 lệnh `migrate dev` gộp cả hai của Prisma.

---

## Hệ quả (Consequences)

### Tích cực
- **Dockerfile đơn giản hẳn:** bỏ toàn bộ bước cài `openssl` (Prisma engine cần để chọn đúng libssl; `pg` dùng module `tls` built-in của Node, không cần gói hệ điều hành nào) + bỏ hẳn bước `prisma generate`. Build nhanh hơn, ít điểm hỏng hơn.
- Vấn đề "mạng công ty chặn 403" **biến mất hoàn toàn** — không còn domain lạ nào được gọi trong toàn bộ vòng đời build/dev/deploy.
- `db.execute(sql\`...\`)` cho FTS query gần như giữ nguyên cú pháp so với `prisma.$queryRaw` cũ (cả hai đều tham số hoá qua tagged template) — ít xáo trộn ở phần vốn đã viết SQL thuần.

### Đánh đổi (Trade-offs)
- **Không có `include` lồng nhau tự động như Prisma** — quan hệ Article ↔ Tag (nhiều-nhiều qua `article_tags`) phải tự viết batch-query + gộp bằng tay (`src/lib/articleTags.ts`). Bù lại: sinh viên thấy rõ N+1 query là gì và cách tránh nó — không bị Prisma "giấu" phía sau `include`.
- **Không có nested-write tự động** (Prisma: `tags: { create: [...] }` trong 1 lệnh) — phải tự bọc `db.transaction()` để giữ atomicity khi tạo/sửa bài viết kèm tag. Code dài hơn nhưng tường minh hơn: sinh viên thấy transaction boundary rõ ràng thay vì Prisma tự lo ngầm.
- Hệ sinh thái/tooling nhỏ hơn Prisma (không có GUI tương đương Prisma Studio riêng — dùng `drizzle-kit studio`, mới hơn và ít tính năng hơn).
- Lỗi driver phải tự map qua mã SQLSTATE của Postgres (`23505`, `23503`...) thay vì mã `P-code` do Prisma trừu tượng hoá sẵn — cần đọc `docs/postgresql.org/errcodes-appendix` thay vì docs Prisma.

---

## Tác động tới nội dung Lab

Bài viết mẫu "PostgreSQL và Prisma" trong dữ liệu seed (`src/db/seed.ts`) đã viết lại thành "PostgreSQL và Drizzle", kể luôn lý do đổi (dogfooding: nội dung Lab phản ánh đúng công cụ dự án đang thật sự dùng).

> **Xem thêm:** [ADR-002](ADR-002-orm-prisma.md) — quyết định gốc (nay superseded) · [ADR-001](ADR-001-techstack.md) — Tech Stack tổng thể · [ADR-003](ADR-003-postgresql.md) — Chọn PostgreSQL
