# Mini-Wiki

Mini-Wiki là ứng dụng wiki thu nhỏ cho phép người dùng tạo, chỉnh sửa và tìm kiếm bài viết có hỗ trợ Markdown và gắn nhãn (tag). Dự án được thiết kế để người học lập trình có thể thực hành toàn bộ vòng đời phần mềm — từ thu thập yêu cầu, thiết kế dữ liệu, lập trình API + giao diện, viết test, đến triển khai thực tế — trên một bài toán đủ nhỏ để nắm trọn, đủ thực tế để học được gì có giá trị.

---

## Tech Stack

| Tầng | Công nghệ | Ghi chú |
|---|---|---|
| **Back-end runtime** | Node.js 20 | LTS |
| **Web framework (BE)** | Express 5 + TypeScript | Typed, async-friendly |
| **ORM** | Prisma 5 | Schema-first, migration tự động |
| **Cơ sở dữ liệu** | PostgreSQL 16 | FTS bằng GIN index |
| **Front-end** | React 18 + Vite 6 | SPA, HMR nhanh |
| **Container hóa** | Docker + Docker Compose | Dev & prod parity |
| **Triển khai** | Railway (free tier) | Deploy từ Git |

---

## Cấu trúc repo (dự kiến)

```
mini-wiki/
├── docs/                   # Tài liệu dự án (requirements, ERD, API contract…)
│   ├── requirements.md
│   ├── erd.md
│   └── api.md
├── api/                    # Express + TypeScript (Chặng 3)
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── index.ts
│   └── prisma/
│       └── schema.prisma
├── web/                    # React + Vite (Chặng 4)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── main.tsx
│   └── index.html
├── docker-compose.yml      # Chặng 6
├── .env.example
├── .gitignore
└── README.md
```

---

## Tiến độ theo chặng

| Chặng | Tên | Trạng thái |
|---|---|---|
| **1** | Ý tưởng & Yêu cầu | ✅ Đang thực hiện |
| 2 | Thiết kế & ADR | ⬜ Chưa bắt đầu |
| 3 | Backend + CSDL | ⬜ Chưa bắt đầu |
| 4 | Frontend | ⬜ Chưa bắt đầu |
| 5 | Kiểm thử | ⬜ Chưa bắt đầu |
| 6 | Đóng gói & Deploy | ⬜ Chưa bắt đầu |

> **Trạng thái hiện tại: Chặng 1 / 6 — Ý tưởng & Yêu cầu**
