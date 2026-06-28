# Hợp đồng API (API Contract) — Mini-Wiki v1

> **API Contract:** Tài liệu mô tả "giao kèo" giữa Front-end và Back-end: có những endpoint nào, gửi dữ liệu gì, nhận lại gì, lỗi trả ra sao. Đây là **bản phác thảo (sketch)** — sẽ được hình thức hóa thành file OpenAPI 3.0 ở Chặng 2.
>
> **Base URL:** `http://localhost:3000/api` (dev) · `https://<app>.railway.app/api` (prod)
> **Định dạng:** JSON (`Content-Type: application/json`)
> **Phiên bản:** 1.0 (Chặng 1 — Phác thảo)

---

## 1. Articles — Bài viết

| # | Method | Endpoint | Mô tả |
|---|---|---|---|
| A1 | `GET` | `/articles` | Lấy danh sách bài viết |
| A2 | `POST` | `/articles` | Tạo bài viết mới |
| A3 | `GET` | `/articles/:slug` | Lấy chi tiết một bài viết theo slug |
| A4 | `PUT` | `/articles/:slug` | Cập nhật bài viết |
| A5 | `DELETE` | `/articles/:slug` | Xóa bài viết |

---

### A1 — GET /articles

Lấy danh sách bài viết đã đăng, sắp xếp mới nhất trước.

**Query params:**

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `tag` | string | Không | Slug của tag để lọc (ví dụ: `?tag=javascript`) |
| `page` | integer | Không | Trang hiện tại (mặc định: 1) |
| `limit` | integer | Không | Số bài/trang (mặc định: 20, tối đa: 100) |

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Học Git cơ bản",
      "slug": "hoc-git-co-ban",
      "published_at": "2026-06-28T07:00:00.000Z",
      "tags": [
        { "id": 2, "name": "Git", "slug": "git" }
      ]
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

> Trường `content` (Markdown) **không** trả về trong danh sách để giảm payload; chỉ trả về ở A3.

**Mã lỗi:** 500

---

### A2 — POST /articles

Tạo bài viết mới.

**Request body:**
```json
{
  "title": "Học Git cơ bản",
  "content": "## Giới thiệu\nGit là hệ thống quản lý phiên bản phân tán...",
  "published_at": "2026-06-28T07:00:00.000Z",
  "tagIds": [2, 5]
}
```

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `title` | string | Có | Tối thiểu 1 ký tự, tối đa 255 |
| `content` | string | Có | Nội dung Markdown |
| `published_at` | ISO 8601 string | Không | NULL = bản nháp |
| `tagIds` | integer[] | Không | Mảng ID tag muốn gắn (có thể rỗng) |

**Response 201:**
```json
{
  "id": 10,
  "title": "Học Git cơ bản",
  "slug": "hoc-git-co-ban",
  "content": "## Giới thiệu\nGit là hệ thống quản lý phiên bản phân tán...",
  "published_at": "2026-06-28T07:00:00.000Z",
  "created_at": "2026-06-28T08:30:00.000Z",
  "updated_at": "2026-06-28T08:30:00.000Z",
  "tags": [
    { "id": 2, "name": "Git", "slug": "git" }
  ]
}
```

**Mã lỗi:** 400 (thiếu/sai trường), 409 (slug trùng), 500

---

### A3 — GET /articles/:slug

Lấy chi tiết đầy đủ một bài viết, bao gồm `content` Markdown gốc.

**Path param:** `slug` — slug của bài viết

**Response 200:**
```json
{
  "id": 10,
  "title": "Học Git cơ bản",
  "slug": "hoc-git-co-ban",
  "content": "## Giới thiệu\nGit là hệ thống quản lý phiên bản phân tán...",
  "published_at": "2026-06-28T07:00:00.000Z",
  "created_at": "2026-06-28T08:30:00.000Z",
  "updated_at": "2026-06-28T08:30:00.000Z",
  "tags": [
    { "id": 2, "name": "Git", "slug": "git" }
  ]
}
```

**Mã lỗi:** 404 (không tìm thấy), 500

---

### A4 — PUT /articles/:slug

Cập nhật toàn bộ hoặc một phần bài viết.

**Path param:** `slug` — slug bài cần sửa

**Request body** (tất cả trường đều tùy chọn — chỉ gửi trường muốn sửa):
```json
{
  "title": "Học Git cơ bản (cập nhật)",
  "content": "## Nội dung mới...",
  "published_at": "2026-06-29T07:00:00.000Z",
  "tagIds": [2, 7]
}
```

> Nếu `tagIds` được gửi, hệ thống **thay thế toàn bộ** danh sách tag hiện tại (không merge).

**Response 200:** Object Article đầy đủ (xem A3)

**Mã lỗi:** 400, 404, 409 (nếu đổi title làm slug trùng với bài khác), 500

---

### A5 — DELETE /articles/:slug

Xóa bài viết. Các liên kết `article_tags` bị xóa cascade tự động.

**Path param:** `slug`

**Response 204 No Content** (body rỗng)

**Mã lỗi:** 404, 500

---

## 2. Tags — Nhãn

| # | Method | Endpoint | Mô tả |
|---|---|---|---|
| T1 | `GET` | `/tags` | Lấy danh sách toàn bộ tag |
| T2 | `POST` | `/tags` | Tạo tag mới |
| T3 | `DELETE` | `/tags/:id` | Xóa tag theo ID |

---

### T1 — GET /tags

**Response 200:**
```json
[
  { "id": 1, "name": "JavaScript", "slug": "javascript" },
  { "id": 2, "name": "Git",        "slug": "git"        },
  { "id": 3, "name": "DevOps",     "slug": "devops"     }
]
```

**Mã lỗi:** 500

---

### T2 — POST /tags

**Request body:**
```json
{ "name": "TypeScript" }
```

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `name` | string | Có | Tối thiểu 1 ký tự, tối đa 100 |

**Response 201:**
```json
{ "id": 4, "name": "TypeScript", "slug": "typescript", "created_at": "2026-06-28T09:00:00.000Z" }
```

**Mã lỗi:** 400, 409 (tên hoặc slug trùng), 500

---

### T3 — DELETE /tags/:id

Xóa tag theo ID số nguyên. Nếu tag còn gắn với bài viết, hệ thống từ chối.

**Response 204 No Content**

**Mã lỗi:** 404, 409 (tag còn liên kết bài viết), 500

---

## 3. Search — Tìm kiếm

| # | Method | Endpoint | Mô tả |
|---|---|---|---|
| S1 | `GET` | `/search` | Tìm kiếm bài viết theo từ khóa |

---

### S1 — GET /search

Full-Text Search trên `title` và `content`, dùng PostgreSQL GIN index.

**Query params:**

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `q` | string | Có | Từ khóa tìm kiếm (tối thiểu 1 ký tự) |
| `page` | integer | Không | Trang (mặc định: 1) |
| `limit` | integer | Không | Số kết quả/trang (mặc định: 20) |

**Ví dụ:** `GET /api/search?q=git+co+ban&page=1`

**Response 200:**
```json
{
  "data": [
    {
      "id": 10,
      "title": "Học Git cơ bản",
      "slug": "hoc-git-co-ban",
      "published_at": "2026-06-28T07:00:00.000Z",
      "tags": [{ "id": 2, "name": "Git", "slug": "git" }]
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "limit": 20,
    "query": "git co ban"
  }
}
```

**Mã lỗi:** 400 (thiếu `q`), 500

---

## 4. Schema JSON chuẩn

### Article Object (đầy đủ)

```json
{
  "id": 10,
  "title": "Học Git cơ bản",
  "slug": "hoc-git-co-ban",
  "content": "## Giới thiệu\n...",
  "published_at": "2026-06-28T07:00:00.000Z",
  "created_at": "2026-06-28T08:30:00.000Z",
  "updated_at": "2026-06-28T08:30:00.000Z",
  "tags": [
    { "id": 2, "name": "Git", "slug": "git" }
  ]
}
```

### Tag Object

```json
{
  "id": 2,
  "name": "Git",
  "slug": "git",
  "created_at": "2026-06-01T00:00:00.000Z"
}
```

---

## 5. Bảng mã lỗi

Tất cả response lỗi theo cấu trúc:
```json
{
  "error": {
    "code": "SLUG_CONFLICT",
    "message": "Slug 'hoc-git-co-ban' đã tồn tại."
  }
}
```

| HTTP Status | Khi nào xảy ra | Ví dụ `code` |
|---|---|---|
| **400 Bad Request** | Request thiếu trường bắt buộc, sai kiểu dữ liệu, hoặc vi phạm validation | `MISSING_FIELD`, `INVALID_TYPE`, `QUERY_REQUIRED` |
| **404 Not Found** | Không tìm thấy article/tag theo slug hoặc id đã cung cấp | `ARTICLE_NOT_FOUND`, `TAG_NOT_FOUND` |
| **409 Conflict** | Slug hoặc tên tag trùng với bản ghi đã tồn tại; hoặc xóa tag còn liên kết bài viết | `SLUG_CONFLICT`, `TAG_NAME_CONFLICT`, `TAG_IN_USE` |
| **500 Internal Server Error** | Lỗi không mong muốn ở server (DB down, bug, v.v.) | `INTERNAL_ERROR` |

---

> **Lưu ý:** Bản này là phác thảo để thống nhất team. Endpoint, trường, và mã lỗi có thể điều chỉnh trong Chặng 2 khi viết file OpenAPI 3.0 chính thức.
