# Prisma — Hướng dẫn nhanh

## schema.prisma là gì?

`schema.prisma` là **nguồn sự thật duy nhất** cho cấu trúc dữ liệu của ứng dụng. File này định nghĩa:

- **datasource:** loại DB và chuỗi kết nối (từ biến môi trường `DATABASE_URL`).
- **generator:** Prisma tự sinh TypeScript client (`@prisma/client`) dựa trên các model bên dưới.
- **models:** Article, Tag, ArticleTag — ánh xạ 1-1 với các bảng trong PostgreSQL.

Khi thay đổi schema, Prisma sinh ra 2 thứ song song:
1. File migration SQL trong `migrations/` (lưu lịch sử thay đổi DB).
2. TypeScript client được cập nhật (dùng trong code Express).

## Tại sao migration được git-track?

Thư mục `migrations/` **phải được commit vào git** — đây là lịch sử thay đổi cấu trúc DB, tương tự như lịch sử commit code. Lợi ích:

- Team review được thay đổi DB trước khi merge (qua Pull Request).
- Deployment production chạy `prisma migrate deploy` để áp đúng các migration còn thiếu — không cần can thiệp tay.
- Rollback được: nếu migration sai, có thể viết migration ngược lại.

## Lệnh sẽ dùng ở Chặng 3

```bash
# Sinh TypeScript client từ schema.prisma (chạy sau mỗi lần sửa schema)
npx prisma generate

# Áp toàn bộ migration vào DB (dùng trong production / CI)
npx prisma migrate deploy

# Tạo migration mới từ thay đổi schema (dùng khi phát triển)
npx prisma migrate dev --name <ten-migration>

# Mở Prisma Studio — GUI xem/sửa data trực quan
npx prisma studio
```

> **Lưu ý:** Chặng 2 chỉ tạo file artifact (schema + migration SQL). Chưa chạy lệnh nào ở bước này — DB và Prisma CLI được thiết lập ở Chặng 3.
