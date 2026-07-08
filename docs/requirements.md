# Đặc tả Yêu cầu — Mini-Wiki v1

> **Phiên bản:** 1.0 (Chặng 1 — Ý tưởng & Yêu cầu)
> **Ngày:** 2026-06-28
> **Phạm vi:** v1 — ứng dụng wiki công khai, không xác thực người dùng

---

## 1. Yêu cầu Chức năng (Functional Requirements)

> **Functional Requirement (FR):** Mô tả hệ thống phải *làm được gì* — hành vi cụ thể mà người dùng hoặc hệ thống khác có thể quan sát, đo lường được.

### 1.1 Quản lý Bài viết (Article)

| Mã | Yêu cầu |
|---|---|
| **FR-1** | Người dùng có thể xem danh sách bài viết đã đăng (published), hiển thị tiêu đề, slug và ngày đăng, sắp xếp theo ngày mới nhất. |
| **FR-2** | Người dùng có thể xem nội dung chi tiết một bài viết qua URL dạng `/articles/:slug`; nội dung Markdown được render thành HTML an toàn. |
| **FR-3** | Người dùng có thể tạo bài viết mới với các trường: `title` (tiêu đề), `content` (nội dung Markdown), `published_at` (ngày đăng, tùy chọn). `slug` được tự động sinh từ `title` (có hỗ trợ ký tự tiếng Việt). |
| **FR-4** | Người dùng có thể chỉnh sửa tiêu đề, nội dung và ngày đăng của bài viết hiện có. |
| **FR-5** | Người dùng có thể xóa một bài viết. Khi xóa, các liên kết `article_tags` tương ứng bị xóa theo (cascade). |
| **FR-6** | Hệ thống ngăn tạo hai bài viết có cùng `slug`; trả về lỗi 409 Conflict khi slug trùng. |

### 1.2 Quản lý Nhãn (Tag)

| Mã | Yêu cầu |
|---|---|
| **FR-7** | Người dùng có thể xem toàn bộ danh sách tag hiện có. |
| **FR-8** | Người dùng có thể tạo tag mới với tên (`name`); `slug` tự động sinh. Slug phải duy nhất. |
| **FR-9** | Người dùng có thể xóa tag. Nếu tag còn liên kết với ít nhất một bài viết, hệ thống từ chối xóa và trả về lỗi 409 Conflict (ON DELETE RESTRICT). |
| **FR-10** | Người dùng có thể gắn hoặc gỡ tag khỏi một bài viết. |
| **FR-11** | Người dùng có thể lọc danh sách bài viết theo một tag cụ thể. |

### 1.3 Tìm kiếm (Search)

| Mã | Yêu cầu |
|---|---|
| **FR-12** | Người dùng có thể tìm kiếm bài viết theo từ khóa; hệ thống tìm trong cả `title` lẫn `content` bằng Full-Text Search (FTS) — tìm kiếm toàn văn hỗ trợ kết quả liên quan. |
| **FR-13** | Kết quả tìm kiếm trả về danh sách bài viết khớp, có phân trang (mặc định tối đa 20 kết quả/trang). |

### 1.4 Render & An toàn Nội dung

| Mã | Yêu cầu |
|---|---|
| **FR-14** | Nội dung Markdown được parse bằng `marked` và làm sạch bằng `DOMPurify` trước khi trả về HTML, ngăn tấn công XSS (Cross-Site Scripting — chèn mã độc vào trang web). |
| **FR-15** | `slug` cho tiếng Việt được chuẩn hóa đúng (ví dụ: "Học lập trình" → `hoc-lap-trinh`) bằng thư viện slugify hỗ trợ locale `vi`. |

---

## 2. Yêu cầu Phi Chức năng (Non-Functional Requirements)

> **Non-Functional Requirement (NFR):** Mô tả hệ thống phải hoạt động *tốt như thế nào* — chất lượng, giới hạn, ràng buộc vận hành.

| Mã | Yêu cầu |
|---|---|
| **NFR-1** | **Hiệu năng (Performance):** API phản hồi dưới 300ms cho các thao tác CRUD đơn lẻ trên môi trường local (dataset < 1.000 bài viết). Truy vấn FTS dưới 500ms nhờ GIN index trên PostgreSQL. |
| **NFR-2** | **Bảo mật — XSS:** Mọi nội dung Markdown từ người dùng phải được sanitize (làm sạch) trước khi render; không cho phép thẻ `<script>`, event handler HTML hay iframe từ nguồn không tin cậy. |
| **NFR-3** | **Bảo mật — SQL Injection:** Toàn bộ truy vấn cơ sở dữ liệu đi qua Drizzle ORM với parameterized query (câu lệnh SQL có tham số, không nối chuỗi trực tiếp), loại bỏ nguy cơ SQL Injection. |
| **NFR-4** | **Bảo mật — CORS:** API chỉ chấp nhận request từ origin của front-end (cấu hình qua biến môi trường `CORS_ORIGIN`); từ chối các origin khác. |
| **NFR-5** | **Không xác thực người dùng (v1):** v1 không có tính năng đăng ký / đăng nhập / phân quyền. Toàn bộ nội dung là công khai và có thể ghi bởi bất kỳ ai truy cập API. |
| **NFR-6** | **Khả năng triển khai (Deployability):** Ứng dụng được container hóa bằng Docker; môi trường dev và production dùng chung `docker-compose.yml`, đảm bảo "chạy ở máy dev" = "chạy ở máy production" (dev/prod parity). |
| **NFR-7** | **Khả năng bảo trì (Maintainability):** Code TypeScript đầy đủ kiểu (strict mode); migration Drizzle được version hóa trong repo; không dùng `any` tùy tiện. |
| **NFR-8** | **Khả năng quan sát (Observability):** Mọi lỗi 5xx phải được log ra stderr với đủ context (endpoint, method, message); không nuốt lỗi thầm lặng. |

---

## 3. User Stories

> **User Story:** Kịch bản ngắn diễn đạt theo góc nhìn người dùng, dạng: *"Là &lt;vai trò&gt;, tôi muốn &lt;hành động&gt; để &lt;giá trị đạt được&gt;."*

| Mã | Story | Tiêu chí chấp nhận (Acceptance Criteria) tóm tắt |
|---|---|---|
| **US-1** | Là **độc giả**, tôi muốn xem danh sách bài viết mới nhất để biết có nội dung gì đáng đọc. | Danh sách sắp xếp theo `published_at` giảm dần; hiển thị tiêu đề + slug + ngày. |
| **US-2** | Là **độc giả**, tôi muốn đọc toàn văn một bài viết qua đường link slug để tiện chia sẻ và bookmark. | URL `/articles/ten-bai-viet` trả về nội dung HTML đã render từ Markdown. |
| **US-3** | Là **tác giả**, tôi muốn tạo bài viết mới với tiêu đề và nội dung Markdown để đăng tải kiến thức lên wiki. | POST `/api/articles` lưu bài, tự sinh slug, trả về 201 với object bài viết đầy đủ. |
| **US-4** | Là **tác giả**, tôi muốn sửa nội dung bài viết đã đăng để cập nhật thông tin khi có thay đổi. | PUT `/api/articles/:slug` cập nhật thành công và trả về bài viết sau khi sửa. |
| **US-5** | Là **tác giả**, tôi muốn xóa bài viết không còn phù hợp để giữ wiki gọn, chất lượng. | DELETE `/api/articles/:slug` xóa bài và các liên kết tag; trả về 204 No Content. |
| **US-6** | Là **tác giả**, tôi muốn gắn tag vào bài viết để phân loại nội dung theo chủ đề. | Gắn tag qua PUT `/api/articles/:slug` với danh sách tag IDs; nhiều tag trên 1 bài được. |
| **US-7** | Là **độc giả**, tôi muốn lọc bài viết theo một tag cụ thể để chỉ đọc nội dung thuộc chủ đề quan tâm. | GET `/api/articles?tag=ten-tag` trả về đúng các bài có tag đó. |
| **US-8** | Là **độc giả**, tôi muốn tìm kiếm bài viết theo từ khóa để tìm nhanh nội dung cần thiết. | GET `/api/search?q=tu-khoa` trả về danh sách bài viết khớp; FTS hoạt động với tiếng Việt. |
| **US-9** | Là **tác giả**, tôi muốn tạo và xóa tag để quản lý hệ thống phân loại của wiki. | POST/DELETE `/api/tags` hoạt động; không xóa được tag còn gắn với bài viết. |

---

## 4. Phạm vi v1

### Trong phạm vi (In Scope)

- CRUD đầy đủ cho Article và Tag
- Quan hệ nhiều-nhiều Article ↔ Tag
- Render Markdown an toàn (XSS-safe)
- Full-Text Search bằng PostgreSQL GIN index
- Slug tự động sinh, hỗ trợ tiếng Việt
- REST API JSON
- Giao diện web SPA (React + Vite)
- Container hóa bằng Docker Compose
- Triển khai lên Railway

### Ngoài phạm vi (Out of Scope — v1)

- Xác thực và phân quyền người dùng (auth/authorization)
- Upload ảnh / media đính kèm
- Bình luận (comments)
- Lịch sử chỉnh sửa (revision history / versioning)
- Thông báo (notifications)
- SEO nâng cao (Server-Side Rendering, sitemap)
- Rate limiting nâng cao
- Đa ngôn ngữ giao diện (i18n)
