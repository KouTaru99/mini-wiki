#!/usr/bin/env bash
# run-stack.sh — Dựng và nghiệm toàn bộ stack mini-wiki bằng 1 lệnh
# Dùng cho: learner muốn xem app chạy production-like mà không cần cài Node/npm thủ công
# Chạy: bash scripts/run-stack.sh [--down]
#
# Cờ --down: sau khi kiểm tra xong, dọn dẹp container (docker compose down).
#            Mặc định GIỮ chạy để bạn vào trình duyệt xem app.

set -euo pipefail

# ── Màu terminal ──────────────────────────────────────────────────────────────
BOLD="\033[1m"
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
CYAN="\033[0;36m"
RESET="\033[0m"

# ── Đọc tham số dòng lệnh ────────────────────────────────────────────────────
AUTO_DOWN=false
for arg in "$@"; do
  [[ "$arg" == "--down" ]] && AUTO_DOWN=true
done

# ── Tiêu đề ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║      Mini-Wiki — Runner 1 lệnh toàn stack    ║${RESET}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════╝${RESET}"
echo ""

# ── Bước 1: Kiểm tra điều kiện tiên quyết ────────────────────────────────────
echo -e "${BOLD}[1/4] Kiểm tra docker + docker compose...${RESET}"

# Kiểm tra lệnh docker có tồn tại không
if ! command -v docker &> /dev/null; then
  echo -e "${RED}✗ Chưa cài Docker.${RESET}"
  echo ""
  echo "Cài đặt Docker Desktop (Mac/Windows/Linux) tại: https://docs.docker.com/get-docker/"
  exit 1
fi

# Kiểm tra docker compose (plugin) hoặc docker-compose (standalone)
# Docker Desktop hiện đại dùng 'docker compose' (không có dấu gạch ngang).
if ! docker compose version &> /dev/null; then
  echo -e "${RED}✗ Chưa có 'docker compose' (plugin).${RESET}"
  echo ""
  echo "Nâng Docker Desktop lên bản mới nhất, hoặc cài Docker Compose v2:"
  echo "  https://docs.docker.com/compose/install/"
  exit 1
fi

echo -e "${GREEN}✓ docker$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 | xargs -I{} echo " {}")${RESET}"
echo -e "${GREEN}✓ docker compose$(docker compose version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 | xargs -I{} echo " {}")${RESET}"
echo ""

# ── Bước 2: Build và khởi động toàn bộ stack ─────────────────────────────────
echo -e "${BOLD}[2/4] Build + khởi động 3 service (db · api · web)...${RESET}"
echo -e "${YELLOW}(Lần đầu build image có thể mất vài phút — hãy kiên nhẫn.)${RESET}"
echo ""

# --build: luôn build lại image (đảm bảo code mới nhất).
# -d: chạy nền (detached), không block terminal.
docker compose up -d --build

echo ""
echo -e "${GREEN}✓ docker compose up hoàn tất.${RESET}"
echo ""

# ── Bước 3: Chờ service api HEALTHY ──────────────────────────────────────────
echo -e "${BOLD}[3/4] Chờ API healthy (tối đa 90 giây)...${RESET}"
echo -e "${YELLOW}(API cần chờ DB sẵn sàng + chạy Prisma migrate deploy → có thể mất 20-40s)${RESET}"
echo ""

TIMEOUT=90   # giây tối đa chờ
ELAPSED=0
POLL=3       # kiểm tra mỗi 3 giây

while true; do
  # Lấy trạng thái health của container api
  HEALTH=$(docker compose ps api --format '{{.Health}}' 2>/dev/null || echo "unknown")
  STATUS=$(docker compose ps api --format '{{.Status}}' 2>/dev/null || echo "unknown")

  # Nếu container bị thoát (exited) → in log và dừng hẳn
  if echo "$STATUS" | grep -qi "exit"; then
    echo -e "${RED}✗ Service 'api' đã exit. Xem log bên dưới:${RESET}"
    echo ""
    docker compose logs api
    echo ""
    echo "Khắc phục: xem log trên, sửa lỗi rồi chạy lại script."
    exit 1
  fi

  if [[ "$HEALTH" == "healthy" ]]; then
    echo -e "${GREEN}✓ API healthy (sau ${ELAPSED}s).${RESET}"
    break
  fi

  if [[ "$ELAPSED" -ge "$TIMEOUT" ]]; then
    echo -e "${RED}✗ API không healthy sau ${TIMEOUT}s. Xem log:${RESET}"
    echo ""
    docker compose logs api
    echo ""
    echo "Khắc phục: tăng start_period trong docker-compose.yml hoặc kiểm tra DATABASE_URL."
    exit 1
  fi

  # In dấu chấm để người dùng biết script đang chờ (không bị nghĩ là treo)
  printf "  Chờ... %ds (health=%s)\n" "$ELAPSED" "$HEALTH"
  sleep "$POLL"
  ELAPSED=$((ELAPSED + POLL))
done

echo ""

# ── Bước 4: Chạy smoke-test vào API ──────────────────────────────────────────
echo -e "${BOLD}[4/4] Chạy smoke-test (12 kịch bản end-to-end)...${RESET}"
echo ""

# BASE_URL trỏ vào cổng 3000 expose ra host; smoke-test.sh đọc biến này.
BASE_URL="http://localhost:3000" bash scripts/smoke-test.sh

# ── Kết quả + URL truy cập ────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║            Stack đang chạy!                  ║${RESET}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${CYAN}Frontend (SPA):${RESET}  http://localhost:8080"
echo -e "  ${CYAN}Backend  (API):${RESET}  http://localhost:3000"
echo -e "  ${CYAN}Health check:${RESET}    http://localhost:3000/health"
echo ""

# ── Xử lý cờ --down ───────────────────────────────────────────────────────────
if [[ "$AUTO_DOWN" == true ]]; then
  echo -e "${YELLOW}Cờ --down được truyền → dọn dẹp container...${RESET}"
  docker compose down
  echo -e "${GREEN}✓ docker compose down hoàn tất.${RESET}"
else
  echo -e "${YELLOW}Để tắt stack khi xong, chạy:${RESET}"
  echo ""
  echo "    docker compose down"
  echo ""
fi
