# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — BUILD
# Compile TypeScript → dist/. Không có bước "generate client" riêng nào (khác
# Prisma trước đây) — Drizzle không sinh code, src/db/schema.ts đã LÀ client,
# import thẳng được. Cũng không cần cài OpenSSL: `pg` dùng module `tls` built-in
# của Node (OpenSSL tĩnh trong chính Node binary), không phải native binary rời
# như engine Prisma từng cần.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS build

WORKDIR /app

# Cài dependencies trước (tận dụng Docker layer cache khi chỉ code thay đổi)
COPY package*.json ./
RUN npm ci

# Copy source rồi build
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript → dist/
RUN npm run build


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — RUNTIME
# Image nhỏ hơn: chỉ production deps, không có devDeps, không có source TS.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim

WORKDIR /app

# Cài lại dependencies nhưng bỏ devDeps (--omit=dev)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled code từ stage build
COPY --from=build /app/dist ./dist

# Migration SQL — src/db/migrate.ts (đã compile vào dist/db/migrate.js) đọc
# thư mục này lúc container khởi động.
COPY drizzle/ ./drizzle/

ENV NODE_ENV=production

EXPOSE 3000

# Chạy migrate trước khi start app:
# - dist/db/migrate.js: áp migrations còn thiếu vào DB (an toàn cho production)
# - dist/index.js: khởi động server
# Dùng sh -c để chạy 2 lệnh tuần tự trong 1 CMD
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/index.js"]
