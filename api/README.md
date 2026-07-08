# Mini-Wiki API

Backend Node.js 20 + Express 5 + Drizzle ORM cho dự án Mini-Wiki.
Chạy trên cổng **3000**, kết nối PostgreSQL 16 qua Docker.

---

## Yêu cầu

| Công cụ | Phiên bản |
|---------|-----------|
| Node.js | 20+       |
| Docker  | 24+       |
| npm     | 9+        |

---

## Khởi động nhanh (6 bước)

### 1. Sao chép file biến môi trường

```bash
cp .env.example .env
```

> `.env.example` đã có giá trị phù hợp cho local. Bạn chỉ cần copy, không cần sửa gì thêm khi chạy dev.

---

### 2. Khởi động PostgreSQL bằng Docker

Chạy từ **thư mục gốc** của repo (nơi có `docker-compose.yml`):

```bash
docker compose up -d db
```

> `-d` (detach): chạy nền, terminal không bị giữ. PostgreSQL sẽ lắng nghe tại `localhost:5432` với user `dev` / password `dev`.

---

### 3. Cài đặt dependencies

```bash
npm install
```

> Tải các thư viện từ `package.json` vào `node_modules/`. Cần chạy 1 lần sau khi clone repo.

---

### 4. Chạy migration

```bash
npm run migrate
```

> Áp dụng toàn bộ migration SQL (`drizzle/*.sql`) vào DB — tạo bảng `articles`, `tags`, `article_tags` và GIN index cho full-text search.

---

### 5. Seed dữ liệu mẫu

```bash
npm run seed
```

> Tạo 4 tag (JavaScript, Git, DevOps, PostgreSQL) và 3 bài viết mẫu tiếng Việt.
> **Idempotent**: chạy nhiều lần không bị lỗi trùng (dùng `onConflictDoUpdate`).

---

### 6. Khởi động server

```bash
npm run dev
```

> `tsx watch`: tự động restart khi bạn sửa code. Server chạy tại → **http://localhost:3000**

Kiểm tra server sống:

```bash
curl http://localhost:3000/health
# → { "status": "ok", "time": "2026-06-28T07:00:00.000Z" }
```

---

## Scripts đầy đủ

| Script | Lệnh thực thi | Dùng khi nào |
|--------|--------------|--------------|
| `npm run dev` | `tsx watch src/index.ts` | Phát triển — hot-reload |
| `npm run build` | `tsc` | Build sang JS (xuất ra `dist/`) |
| `npm start` | `node dist/index.js` | Chạy bản build production |
| `npm run db:generate` | `drizzle-kit generate` | Sinh migration SQL từ thay đổi `src/db/schema.ts` |
| `npm run migrate` | `tsx src/db/migrate.ts` | Áp migration còn thiếu — dùng trên dev/prod |
| `npm run seed` | `tsx src/db/seed.ts` | Nạp dữ liệu mẫu |
| `npm run db:reset` | xóa schema + `migrate` + `seed` | ⚠️ Xóa sạch DB và chạy lại từ đầu |

---

## Cấu trúc thư mục

```
api/
├── drizzle/
│   ├── meta/              Snapshot + journal (Drizzle Kit tự quản lý)
│   └── *.sql              Migration SQL (đừng sửa tay)
├── drizzle.config.ts       Cấu hình Drizzle Kit (schema path, DB credentials)
├── src/
│   ├── controllers/        Business logic (Bước 3.3–3.5)
│   ├── routes/             Express router (Bước 3.3–3.5)
│   ├── db/
│   │   ├── schema.ts        Định nghĩa bảng DB (nguồn sự thật)
│   │   ├── migrate.ts        Áp migration (dùng trong Dockerfile CMD)
│   │   ├── reset.ts          Xóa sạch schema public
│   │   └── seed.ts           Script nạp dữ liệu mẫu
│   ├── lib/
│   │   └── db.ts            Drizzle client singleton (Pool + drizzle())
│   ├── middleware/
│   │   ├── errorHandler.ts  Map lỗi → HTTP response
│   │   └── notFound.ts      Handler 404 route
│   └── index.ts            Entry point, khởi động server
├── .env.example            Biến môi trường mẫu
├── package.json
└── tsconfig.json
```
