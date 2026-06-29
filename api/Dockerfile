# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — BUILD
# Dùng node:22-slim (không dùng alpine: Prisma/OpenSSL không tương thích alpine).
# Cài đủ devDeps để chạy tsc + prisma generate, rồi xả tất cả ở stage sau.
# Kết quả: thư mục dist/ + Prisma client đã generate trong node_modules/.prisma
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS build

WORKDIR /app

# Prisma cần OpenSSL để chọn đúng query/migration engine. node:22-slim (debian)
# KHÔNG có sẵn openssl → prisma generate/migrate báo "failed to detect libssl".
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Cài dependencies trước (tận dụng Docker layer cache khi chỉ code thay đổi)
COPY package*.json ./
COPY prisma/ ./prisma/
RUN npm ci

# Copy source rồi build
COPY tsconfig.json ./
COPY src/ ./src/

# Generate Prisma client (tạo ra node_modules/.prisma/client + types)
RUN npx prisma generate

# Compile TypeScript → dist/
RUN npm run build


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — RUNTIME
# Image nhỏ hơn: chỉ production deps, không có devDeps, không có source TS.
# Sao chép Prisma client đã generate từ stage build để tránh generate lại.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim

WORKDIR /app

# OpenSSL cho Prisma (runtime cũng cần: migrate deploy + query engine khi chạy).
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Cài lại dependencies nhưng bỏ devDeps (--omit=dev)
COPY package*.json ./
COPY prisma/ ./prisma/
RUN npm ci --omit=dev

# Copy compiled code từ stage build
COPY --from=build /app/dist ./dist

# Copy Prisma generated client từ stage build (khỏi phải generate lại trong runtime)
# .prisma chứa query engine + generated types; @prisma/client chứa base package
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client

ENV NODE_ENV=production

EXPOSE 3000

# Chạy migrate trước khi start app:
# - prisma migrate deploy: áp migrations vào DB (safe cho production, không tạo migration mới)
# - node dist/index.js: khởi động server
# Dùng sh -c để chạy 2 lệnh tuần tự trong 1 CMD
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
