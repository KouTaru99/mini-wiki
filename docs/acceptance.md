# Quy trình Nghiệm thu (Acceptance Testing) — Chặng 5

## Smoke-test là gì?

**Smoke-test** (kiểm tra "khói") là bước chạy nhanh các kịch bản cốt lõi để xác nhận hệ thống **không bị cháy** — tức là các chức năng quan trọng nhất hoạt động đúng trước khi trao sản phẩm cho khách hàng hoặc trước khi merge vào nhánh chính.

Script `scripts/smoke-test.sh` ở đây kiểm tra **toàn bộ API end-to-end** bằng HTTP thật (curl), bao gồm: health check, CRUD bài viết, tạo tag, tìm kiếm, và các trường hợp lỗi (409, 400, 404). Nếu tất cả xanh = API đạt tiêu chuẩn nghiệm thu cho Chặng 5.

> **Lưu ý phạm vi:** Đây là smoke-test ở tầng API (backend). Nghiệm thu toàn diện bao gồm web + API chạy trong container (Docker) sẽ hoàn tất ở **Chặng 6** khi có Dockerfile.

---

## Yêu cầu môi trường

| Công cụ | Phiên bản yêu cầu | Kiểm tra |
|---------|------------------|---------|
| Node.js | **22.x** (xem `.nvmrc`) | `node -v` |
| npm | ≥ 10 | `npm -v` |
| Docker | bất kỳ | `docker -v` |
| bash | ≥ 3.2 (macOS có sẵn) | `bash --version` |
| python3 | bất kỳ (dùng để parse JSON) | `python3 --version` |
| curl | bất kỳ | `curl --version` |

> **Node 22** là bắt buộc vì file `.nvmrc` trong repo chỉ định phiên bản này. Nếu dùng `nvm`: `nvm use` sẽ tự chuyển đúng phiên bản.

---

## Các bước nghiệm thu (clone fresh)

### Bước 1 — Lấy code

```bash
git clone <url-repo> mini-wiki
cd mini-wiki
```

### Bước 2 — Kiểm tra Node version

```bash
# Nếu dùng nvm:
nvm use          # tự đọc .nvmrc, chuyển sang Node 22

# Không dùng nvm thì kiểm tra thủ công:
node -v          # phải ra v22.x.x
```

### Bước 3 — Khởi động cơ sở dữ liệu

```bash
# Khởi động PostgreSQL bằng Docker Compose
docker compose up -d db
```

> Lần đầu sẽ tải image PostgreSQL (~100MB). Kiểm tra: `docker compose ps` — cột `State` phải là `Up`.

### Bước 4 — Cài phụ thuộc và migrate database

```bash
cd api
npm install

# Chạy migration (tạo bảng) và seed dữ liệu mẫu
npm run migrate         # áp migration Drizzle
npm run seed            # nạp dữ liệu mẫu
```

> Nếu migrate lỗi "can't connect to database": đợi thêm 5 giây rồi thử lại (PostgreSQL trong Docker cần thời gian khởi động).

### Bước 5 — Khởi động API

```bash
# Vẫn trong thư mục api/
npm run dev
```

Kết quả mong đợi (in ra terminal):

```
Server running on http://localhost:3000
Database connected
```

Để terminal này **chạy ngầm** (mở tab terminal mới cho bước tiếp).

### Bước 6 — Chạy smoke-test

```bash
# Quay về thư mục gốc repo
cd ..

bash scripts/smoke-test.sh
```

Kết quả mong đợi:

```
Kiểm tra kết nối tới http://localhost:3000 ...
API đang chạy. Bắt đầu smoke-test...

[1] Health check
  ✓ GET /health (HTTP 200)
[2] Danh sách bài viết
  ✓ GET /api/articles (HTTP 200)
...
[12] Lấy bài đã xóa
  ✓ GET /api/articles/<slug> (đã xóa → 404) (HTTP 404)

────────────────────────────────────
Kết quả: 12/12 passed ✓ — tất cả kịch bản đạt
```

**12/12 xanh = API đạt tiêu chuẩn nghiệm thu Chặng 5.**

---

## Tùy chỉnh BASE_URL

Nếu API chạy ở cổng khác (ví dụ môi trường CI/staging):

```bash
BASE_URL=http://localhost:4000 bash scripts/smoke-test.sh
```

---

## Xử lý khi smoke-test thất bại

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|------------|----------------------|-----------|
| `API không phản hồi` | API chưa chạy hoặc sai port | Chạy `npm run dev` trong `api/`, kiểm tra port |
| `POST /api/articles → 500` | Database chưa migrate | Chạy `npm run db:migrate` |
| `GET /api/search → 404` | Endpoint search chưa có | Kiểm tra `api/src/routes/` |
| Test trùng lặp giữa các lần chạy | Slug bị conflict | Script dùng timestamp, thường không xảy ra |

---

## Chặng tiếp theo (Chặng 6)

Chặng 6 sẽ thêm:
- `Dockerfile` cho cả `api/` và `web/`
- `docker-compose.yml` chạy toàn bộ stack (db + api + web) một lệnh
- Nghiệm thu end-to-end: mở trình duyệt vào `http://localhost:5173` và thao tác thủ công
