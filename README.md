# Mini-Wiki

**Mini-Wiki** là ứng dụng wiki thu nhỏ: tạo, chỉnh sửa, tìm kiếm bài viết có hỗ trợ Markdown và gắn nhãn (tag).

> **Đây là repo "lời giải" của 1 Lab trên nền tảng Praxis** — nơi learner build-along theo đúng quy trình PTPM (Phát triển Phần mềm chuyên nghiệp).  
> USP không phải ở app wiki, mà ở **6 Chặng PTPM** được áp lên nó: từ thu thập yêu cầu, thiết kế dữ liệu, lập trình API + giao diện, viết test, đến đóng gói container. Mỗi commit `[step-X.Y]` là 1 Bước học cụ thể — `git diff` để đối chiếu.

---

## Skill Stack

![Node 22](https://img.shields.io/badge/Node-22-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle_ORM-latest-C5F74F?logo=drizzle&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)

---

## Yêu cầu

| Công cụ | Phiên bản | Ghi chú |
|---------|-----------|---------|
| **Node.js** | 22 | Xem `.nvmrc` → `nvm use` để chuyển tự động |
| **Docker + Docker Compose** | Docker Desktop ≥ 4.x | Docker Compose v2 (plugin, không phải standalone) |
| **Git** | bất kỳ | Để `git diff` theo dõi từng Bước |

---

## Chạy nhanh

### (a) Docker full — 1 lệnh

```bash
bash scripts/run-stack.sh
```

Script tự động: build image → khởi động db/api/web → chờ API healthy → chạy smoke-test 12 kịch bản.

- **Frontend:** http://localhost:8080
- **API:** http://localhost:3000
- **Tắt khi xong:** `docker compose down`

> Tùy chọn `--down` tự dọn container sau khi smoke-test xong:
> ```bash
> bash scripts/run-stack.sh --down
> ```

### (b) Dev mode — hot reload

```bash
# Terminal 1: khởi động PostgreSQL
docker compose up -d db

# Terminal 2: API (hot reload TypeScript)
cd api && npm install && npm run dev

# Terminal 3: Frontend (HMR Vite)
cd web && npm install && npm run dev
```

- **Frontend dev:** http://localhost:5173
- **API dev:** http://localhost:3000

---

## Kiểm thử

```bash
# Unit test + integration test (31 test, coverage ≥ 70%)
cd api && npm test

# Smoke-test end-to-end (12 kịch bản, API phải đang chạy)
bash scripts/smoke-test.sh
```

---

## Cấu trúc thư mục

```
mini-wiki/
├── api/                    # Backend — Express 5 + TypeScript + Drizzle ORM
│   ├── src/
│   │   ├── routes/         # Định nghĩa route (articles, tags, search, health)
│   │   ├── controllers/    # Xử lý request/response
│   │   ├── db/
│   │   │   └── schema.ts   # Schema CSDL (nguồn sự thật)
│   │   ├── middleware/      # Error handler, validation
│   │   └── index.ts        # Entry point
│   ├── drizzle/             # Migration SQL sinh từ schema.ts
│   └── Dockerfile
├── web/                    # Frontend — React 18 + Vite 6
│   ├── src/
│   │   ├── pages/          # ArticleList, ArticleDetail, ArticleEditor
│   │   ├── components/     # TagFilter, SearchBar, MarkdownRenderer, ...
│   │   └── main.tsx
│   └── Dockerfile
├── docs/                   # Tài liệu dự án (xem bên dưới)
├── scripts/
│   ├── run-stack.sh        # Runner 1 lệnh toàn stack
│   └── smoke-test.sh       # Smoke-test 12 kịch bản API
├── docker-compose.yml      # Orchestration: db + api + web
└── .nvmrc                  # Node 22
```

---

## Hành trình 6 Chặng PTPM

> Mỗi commit `[step-X.Y]` = 1 Bước. Chạy `git log --oneline` để xem toàn bộ lịch sử.

| Chặng | Tên | Làm gì | Artifact chính |
|-------|-----|--------|----------------|
| **1** | Ý tưởng & Yêu cầu | Thu thập yêu cầu người dùng, viết user stories, xác định scope v1 | `docs/requirements.md` |
| **2** | Thiết kế & ADR | Thiết kế ERD, API contract, quyết định kiến trúc (ADR) | `docs/erd.md` · `docs/api.md` · `docs/adr/` · `docs/openapi.yaml` |
| **3** | Backend + CSDL | Dựng Express API, schema Drizzle, migration, CRUD + search + tag | `api/src/` · `api/src/db/schema.ts` |
| **4** | Frontend | Xây SPA React: danh sách, chi tiết, editor Markdown, tìm kiếm, lọc tag | `web/src/` |
| **5** | Kiểm thử | Unit test (Vitest) + integration test (Supertest) + acceptance smoke-test | `api/src/__tests__/` · `scripts/smoke-test.sh` · PR template |
| **6** | Đóng gói & Deploy | Dockerfile api/web + docker-compose + runner 1 lệnh + README | `docker-compose.yml` · `scripts/run-stack.sh` · tài liệu này |

---

## Đóng gói & "Deploy"

"Deploy" trong scope này = **`docker compose up` chạy production-like local** — $0, không cần cloud, nhưng app chạy đúng như trên server thật (build optimized, Nginx serve SPA, API sau container network, migrate tự động).

Muốn đưa lên URL public: xem [`docs/deploy-cloud.md`](docs/deploy-cloud.md).  
Danh sách mục cần kiểm tra trước khi lên production: xem [`docs/production-checklist.md`](docs/production-checklist.md).

---

## Tài liệu dự án

| File | Nội dung |
|------|----------|
| [`docs/requirements.md`](docs/requirements.md) | User stories, scope v1, non-functional requirements |
| [`docs/erd.md`](docs/erd.md) | Entity Relationship Diagram |
| [`docs/api.md`](docs/api.md) | API contract (mô tả endpoint) |
| [`docs/openapi.yaml`](docs/openapi.yaml) | OpenAPI 3.0 spec (import vào Postman/Swagger UI) |
| [`docs/adr/`](docs/adr/) | Architectural Decision Records |
| [`docs/acceptance.md`](docs/acceptance.md) | Acceptance criteria cho từng tính năng |
| [`docs/code-review-checklist.md`](docs/code-review-checklist.md) | Checklist review trước khi merge PR |
| [`docs/production-checklist.md`](docs/production-checklist.md) | Checklist sẵn sàng production |
| [`docs/deploy-cloud.md`](docs/deploy-cloud.md) | Hướng dẫn deploy lên cloud ($0 / rẻ) |
