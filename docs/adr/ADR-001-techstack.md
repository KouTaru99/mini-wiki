# ADR-001 — Chọn Node.js 20 + Express 5 + TypeScript (BE) & React 18 + Vite 6 (FE)

> **ADR (Architecture Decision Record — Biên bản Quyết định Kiến trúc):** Tài liệu ghi lại một quyết định kiến trúc quan trọng: *tại sao* chọn công nghệ này, các phương án nào đã được cân nhắc, và hệ quả của lựa chọn đó. ADR giúp team tương lai hiểu được bối cảnh quyết định — không phải chỉ "dùng gì" mà là "vì sao dùng".

---

## Trạng thái (Status)

**Accepted** — 2026-06-28

---

## Bối cảnh (Context)

Mini-Wiki là ứng dụng wiki công khai CRUD (Create-Read-Update-Delete) phục vụ mục đích học tập. Team cần chọn:

1. **Runtime & framework Back-end:** Ngôn ngữ, web framework, type system.
2. **Framework Front-end:** SPA framework và build tool.

**Ràng buộc:**
- Người học chưa quen nhiều ngôn ngữ — ưu tiên **1 ngôn ngữ xuyên suốt** toàn stack để giảm friction.
- Tách FE/BE thành hai ứng dụng riêng biệt để dạy rõ **API boundary** (ranh giới giao tiếp).
- Không cần SSR (Server-Side Rendering) ở v1 — SPA là đủ.

---

## Các lựa chọn (Options)

### Back-end

| Phương án | Mô tả | Dẫn chứng |
|---|---|---|
| **Node.js 20 + Express 5 + TypeScript** ✅ | JavaScript runtime + web framework tối giản + kiểu tĩnh | 47% devs dùng Node.js (Stack Overflow 2024); Express thư viện ecosystem lớn nhất; TypeScript giảm bug runtime |
| Spring Boot (Java) | Framework enterprise Java | Barrier học cao (JVM, Maven/Gradle, Java verbosity); phù hợp enterprise VN nhưng quá nặng cho bài học |
| Go + Fiber | Go runtime + web framework tốc độ cao | Hiệu năng xuất sắc nhưng ecosystem nhỏ hơn; người học cần học thêm Go syntax |
| Python + FastAPI | Python runtime + modern async framework | Async support tốt, dễ đọc; nhưng dynamic typing mặc định + cần thêm công cụ type hinting |

### Front-end

| Phương án | Mô tả | Dẫn chứng |
|---|---|---|
| **React 18 + Vite 6** ✅ | UI library phổ biến nhất + build tool tốc độ cao | React được 40% devs dùng (SO 2024, #1 framework); Vite HMR ~50ms (nhanh gấp 10–20× webpack) |
| Next.js 14 (fullstack) | React meta-framework tích hợp SSR/SSG/API routes | Tốt cho production, nhưng blur ranh giới FE/BE — khó dạy API contract rõ ràng |
| Vue 3 + Vite | Progressive framework, syntax template | Dễ học, nhưng thị phần nhỏ hơn React; ít tài liệu learning hơn |

---

## Quyết định (Decision)

Chọn **Node.js 20 + Express 5 + TypeScript** cho Back-end và **React 18 + Vite 6** cho Front-end.

Lý do cốt lõi:
- **1 ngôn ngữ (TypeScript)** xuyên suốt BE lẫn FE → người học không phải context-switch ngôn ngữ.
- Express 5 **tối giản** — không che khuất cách HTTP hoạt động, giúp người học thấy request/response lifecycle thật sự.
- Tách FE (`web/`) và BE (`api/`) thành 2 thư mục riêng → **API boundary hiện rõ**: FE chỉ giao tiếp qua `http://localhost:3000/api`.
- Vite HMR cực nhanh → feedback loop ngắn khi viết component.

---

## Hệ quả (Consequences)

### Tích cực
- Người học dùng **cùng kiến thức TypeScript** khi làm cả BE lẫn FE.
- Express 5 hỗ trợ async/await native — tránh callback hell, code sạch hơn.
- Ecosystem npm khổng lồ: `marked`, `slugify`, `zod`, `cors`, `helmet` — mọi thứ đã có sẵn.
- Vite build production nhanh, config tối giản.

### Đánh đổi (Trade-offs)
- Node.js single-thread → nếu sau này có CPU-intensive task (e.g., render PDF), cần worker thread hoặc tách service. Với v1 wiki đơn giản, không thành vấn đề.
- Express 5 ít opiniated → team phải tự tổ chức cấu trúc folder (đây cũng là bài học tốt).
- React SPA → SEO yếu (no SSR). Chấp nhận được vì v1 không ưu tiên SEO (đã liệt kê Out of Scope).

---

> **Xem thêm:** [ADR-004](ADR-004-migrate-drizzle.md) — Chọn ORM (Drizzle, thay thế ADR-002) · [ADR-003](ADR-003-postgresql.md) — Chọn PostgreSQL
