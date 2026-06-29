# Phụ lục: Deploy lên Cloud

> **Nhấn mạnh:** Image Docker đã build ở Chặng 6 có thể deploy đi **bất kỳ nền tảng nào** hỗ trợ container. Phần này liệt kê các lựa chọn $0 hoặc rất rẻ cho mục tiêu học.

---

## Nguyên tắc chọn nền tảng

| Nhu cầu | Khuyến nghị |
|---------|-------------|
| Học, không cần URL public | `docker compose up` local — đủ rồi, không cần cloud |
| Muốn URL public, chấp nhận "ngủ" | **Render** (free tier) |
| Muốn VPS thật sự $0 bền vững | **Oracle Cloud Always Free** + CapRover/Coolify |

---

## Lựa chọn 1 — Render (Free Tier)

**Render** có free tier thật: **750 giờ instance/tháng/workspace**, không cần thẻ tín dụng.

**Đánh đổi cần biết:**
- Web service **ngủ sau 15 phút** không có request. Lần đầu truy cập sau khi ngủ mất khoảng **30–60 giây** để khởi động lại.
- Free tier không đủ cho cả 3 service (db + api + web) chạy liên tục — phù hợp để demo ngắn.
- Render có **managed PostgreSQL** riêng (free tier giới hạn dung lượng và thời gian).

**Cách deploy:**
1. Push code lên GitHub.
2. Tạo tài khoản tại [render.com](https://render.com).
3. "New > Web Service" → kết nối repo → Render tự detect Dockerfile.
4. Đặt biến môi trường (`DATABASE_URL`, `CORS_ORIGIN`, `PORT`).
5. Deploy.

---

## Lựa chọn 2 — Self-hosted PaaS (CapRover / Coolify)

**CapRover** và **Coolify** là phần mềm mã nguồn mở miễn phí, cho phép deploy app bằng Docker qua giao diện web đơn giản (tương tự Heroku tự host).

**Điều kiện quan trọng:**
- Phần mềm miễn phí, **nhưng vẫn cần 1 VPS để cài đặt** — VPS = mất tiền (trừ khi dùng Oracle Free).
- **CapRover**: nhẹ, yêu cầu tối thiểu ~1 GB RAM.
- **Coolify**: nặng hơn, khuyến nghị ≥ 2 GB RAM.

---

## Lựa chọn 3 — Oracle Cloud Always Free (VPS $0 thật sự)

**Oracle Cloud Always Free** cung cấp VM Arm (Ampere A1) với ~2 OCPU / 12 GB RAM — **miễn phí vĩnh viễn** theo chính sách "Always Free".

Đây là **cách duy nhất** có VPS công khai $0 lâu dài để tự cài CapRover/Coolify.

**Đánh đổi cần biết:**
- Cần thẻ tín dụng để xác minh danh tính (Oracle không charge nếu chỉ dùng Always Free resources).
- Một số vùng (region) Always Free **hết quota** — có thể phải thử nhiều vùng.
- Oracle có thể **thu hồi VM nếu idle quá lâu** (không dùng trong vài tháng) — cần theo dõi định kỳ.
- Thủ tục tạo tài khoản Oracle phức tạp hơn Render.

**Luồng setup:**
1. Đăng ký Oracle Cloud → tạo VM Always Free (Arm, Ubuntu 22.04).
2. SSH vào VM, cài Docker.
3. Cài CapRover (`docker run -p 3000:3000 -v /var/run/docker.sock:/var/run/docker.sock caprover/caprover`) hoặc Coolify.
4. Deploy mini-wiki qua giao diện CapRover/Coolify.

---

## Không khuyến nghị

| Nền tảng | Lý do |
|----------|-------|
| **Railway** | Không còn free tier bền: $5 trial 30 ngày, sau đó $1–5/tháng |
| **Fly.io** | Free tier rất giới hạn, dễ bị charge ngoài ý muốn nếu không cẩn thận |

---

## Kết luận

Cho mục tiêu **học và demo**, `docker compose up` local là đủ — bạn có môi trường production-like hoàn chỉnh mà không tốn gì. Khi thật sự cần URL public:

- **Nhanh, không cần tiền:** Render free (chấp nhận sleep).
- **Bền vững $0:** Oracle Free VM + CapRover/Coolify (phức tạp hơn, phù hợp người muốn học ops).
