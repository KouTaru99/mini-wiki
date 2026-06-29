# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — BUILD
# Vite "bake" biến môi trường LÚC BUILD (không phải lúc runtime) vào bundle JS.
# Vì vậy VITE_API_URL phải được truyền vào đây qua ARG/ENV trước npm run build.
# Sau khi build, ta chỉ cần file tĩnh trong dist/ — Node.js không cần nữa.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS build

WORKDIR /app

# Cài dependencies trước (tận dụng layer cache)
COPY package*.json ./
RUN npm ci

# Copy toàn bộ source frontend
COPY . .

# ARG: nhận giá trị từ docker-compose (build.args) hoặc --build-arg
# ENV: expose ARG thành biến môi trường để Vite đọc khi build
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL

# Build SPA tĩnh → dist/
RUN npm run build


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — SERVE
# Chỉ cần nginx:alpine + file tĩnh từ stage build.
# Image cuối rất nhỏ: không có Node.js, không có source, không có node_modules.
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:alpine

# Xóa config mặc định của nginx, thay bằng config tùy chỉnh (SPA fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy file tĩnh đã build từ stage build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
