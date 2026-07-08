# Drizzle — Hướng dẫn nhanh

## `src/db/schema.ts` là gì?

`src/db/schema.ts` là **nguồn sự thật duy nhất** cho cấu trúc dữ liệu của ứng dụng — viết bằng TypeScript thuần (không phải DSL riêng như Prisma). Mỗi bảng là 1 hằng số `pgTable(...)`, import thẳng vào code Express để query — **không có bước "generate client"** nào cả, vì bản thân file này đã LÀ client.

## Khi thay đổi schema

```bash
# 1. Sửa src/db/schema.ts

# 2. Sinh migration SQL từ phần khác biệt (diff) so với lần trước
npm run db:generate
# → tạo file mới trong drizzle/ (vd 0001_ten_ngau_nhien.sql), review được bằng git diff

# 3. Áp migration vào DB
npm run migrate
```

Khác với Prisma (1 lệnh `migrate dev` vừa tạo vừa áp), Drizzle tách rõ 2 bước —
minh bạch hơn: bạn luôn thấy trước SQL sẽ chạy (`db:generate`) trước khi thực sự
áp vào DB (`migrate`).

## Tại sao migration được git-track?

Thư mục `drizzle/` (file `.sql` + `meta/`) **phải được commit vào git** — lịch sử
thay đổi cấu trúc DB, tương tự lịch sử commit code:

- Team review được thay đổi DB trước khi merge (qua Pull Request).
- Deployment chạy `npm run migrate` (dùng `migrate()` của `drizzle-orm` — xem
  `src/db/migrate.ts`) để áp đúng các migration còn thiếu, không cần can thiệp tay.
- `meta/_journal.json` + `meta/*_snapshot.json`: Drizzle Kit tự quản lý, dùng để
  tính diff cho lần `db:generate` tiếp theo — không sửa tay.

## Lệnh hay dùng

```bash
npm run db:generate   # Sinh migration SQL từ thay đổi schema.ts
npm run migrate       # Áp toàn bộ migration còn thiếu vào DB
npm run seed          # Chạy dữ liệu mẫu (src/db/seed.ts)
npm run db:reset      # Xóa sạch schema public + migrate + seed lại từ đầu

npx drizzle-kit studio # GUI xem/sửa data trực quan (tương đương Prisma Studio)
```
