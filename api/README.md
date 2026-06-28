# Mini-Wiki API

Backend Node.js 20 + Express 5 + Prisma 5 cho dự án Mini-Wiki.
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

> `prisma migrate deploy`: áp dụng toàn bộ migration SQL vào DB — tạo bảng `articles`, `tags`, `article_tags` và GIN index cho full-text search.

---

### 5. Seed dữ liệu mẫu

```bash
npm run seed
```

> Tạo 4 tag (JavaScript, Git, DevOps, PostgreSQL) và 3 bài viết mẫu tiếng Việt.
> **Idempotent**: chạy nhiều lần không bị lỗi trùng (dùng `upsert`).

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
| `npm run migrate` | `prisma migrate deploy` | Apply migration trên dev/prod |
| `npm run migrate:dev` | `prisma migrate dev` | Tạo migration mới khi sửa schema |
| `npm run seed` | `prisma db seed` | Nạp dữ liệu mẫu |
| `npm run generate` | `prisma generate` | Tái sinh Prisma Client sau khi sửa schema |
| `npm run db:reset` | `prisma migrate reset --force` | ⚠️ Xóa sạch DB và chạy lại từ đầu |

---

## Cấu trúc thư mục

```
api/
├── prisma/
│   ├── migrations/       Migration SQL (đừng sửa tay)
│   ├── schema.prisma     Định nghĩa model DB
│   └── seed.ts           Script nạp dữ liệu mẫu
├── src/
│   ├── controllers/      Business logic (Bước 3.3–3.5)
│   ├── routes/           Express router (Bước 3.3–3.5)
│   ├── lib/
│   │   └── prisma.ts     PrismaClient singleton
│   ├── middleware/
│   │   ├── errorHandler.ts  Map lỗi → HTTP response
│   │   └── notFound.ts      Handler 404 route
│   └── index.ts          Entry point, khởi động server
├── .env.example          Biến môi trường mẫu
├── package.json
└── tsconfig.json
```
