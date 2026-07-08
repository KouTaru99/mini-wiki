# Production Checklist — Mini-Wiki

> Checklist này dành cho learner muốn đưa app ra môi trường thật (VPS hoặc cloud).  
> Những mục **chưa làm** được ghi rõ trạng thái và lý do — không che giấu.

---

## Bảo mật & Cấu hình

| # | Hạng mục | Trạng thái | Ghi chú |
|---|----------|------------|---------|
| 1 | **Biến môi trường** — không hardcode secret, `.env` phải có trong `.gitignore` | ✅ Đã làm | `.env` được gitignore; `DATABASE_URL`, `CORS_ORIGIN`, `PORT` đọc từ env |
| 2 | **HTTPS / Reverse-proxy** — đặt Nginx/Caddy/Traefik trước app khi lên mạng | ⚠️ Chưa làm | Scope v1 chỉ chạy local. Khi lên mạng: thêm Nginx + Certbot (Let's Encrypt) hoặc dùng Cloudflare Tunnel. Đây là lab nâng cao. |
| 3 | **CORS đúng origin** — `CORS_ORIGIN` trỏ đúng domain production, không để `*` | ✅ Đã làm | Giá trị đặt trong `docker-compose.yml`; thay bằng domain thật khi deploy |
| 4 | **Rate limiting** — giới hạn số request/IP tránh lạm dụng | ❌ Chưa có | Scope v1 bỏ qua. Lab nâng cao: thêm `express-rate-limit` ở tầng middleware. |
| 5 | **Authentication / Authorization** — xác thực người dùng | ❌ Chưa có | Mini-wiki v1 là public (đọc/ghi tự do). Thêm auth = lab riêng (JWT hoặc session). |

---

## Cơ sở dữ liệu

| # | Hạng mục | Trạng thái | Ghi chú |
|---|----------|------------|---------|
| 6 | **Migration tự động khi khởi động** — áp migration Drizzle trước khi app nhận request | ✅ Đã làm | `Dockerfile` của api chạy `node dist/db/migrate.js` trong entrypoint |
| 7 | **Healthcheck DB** — `pg_isready` trước khi api start | ✅ Đã làm | `docker-compose.yml` dùng `condition: service_healthy` cho db |
| 8 | **Backup định kỳ** — `pg_dump` lưu file dump PostgreSQL | ❌ Chưa có | Scope v1 bỏ qua. Production thật: dùng `pg_dump` theo cron, hoặc managed DB (Render Postgres, Supabase) có sẵn backup. |

---

## Vận hành & Quan sát

| # | Hạng mục | Trạng thái | Ghi chú |
|---|----------|------------|---------|
| 9 | **Healthcheck API** — endpoint `/health` trả `200` | ✅ Đã làm | `GET /health` trả `{ "status": "ok" }` |
| 10 | **Logging ra stdout** — không ghi log vào file trong container | ✅ Đã làm | Morgan middleware ghi HTTP log ra stdout; Docker Compose đọc qua `docker compose logs` |
| 11 | **Restart policy** — container tự khởi động lại khi crash | ⚠️ Chưa đặt | Thêm `restart: unless-stopped` vào mỗi service trong `docker-compose.yml` khi deploy production |
| 12 | **Resource limits** — giới hạn CPU/RAM cho container | ❌ Chưa có | Scope v1 bỏ qua. Production thật: thêm `deploy.resources.limits` trong `docker-compose.yml` hoặc dùng Kubernetes. |

---

## Tổng kết

```
✅ Đã làm (6 mục):   env vars · CORS · DB healthcheck · migration · API healthcheck · logging
⚠️  Cần thêm khi lên mạng (2 mục):   HTTPS/reverse-proxy · restart policy
❌ Lab nâng cao (4 mục):   rate limiting · auth · DB backup · resource limits
```

> **Nguyên tắc:** Đối với mục tiêu học, stack hiện tại (`docker compose up`) là đủ để chạy production-like local.  
> Muốn URL public thật → xem [hướng dẫn deploy cloud](./deploy-cloud.md).
