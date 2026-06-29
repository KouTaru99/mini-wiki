#!/usr/bin/env bash
# smoke-test.sh — Kiểm tra toàn bộ API mini-wiki end-to-end bằng curl
# Chạy: bash scripts/smoke-test.sh
# Yêu cầu: API đang chạy tại BASE_URL (mặc định http://localhost:3000)

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

# ── Màu sắc terminal ──────────────────────────────────────────────────────────
GREEN="\033[0;32m"
RED="\033[0;31m"
RESET="\033[0m"

PASS=0
FAIL=0

# ── Hàm kiểm tra mã trạng thái HTTP ─────────────────────────────────────────
# Dùng: assert_status <mong-đợi> <thực-tế> <mô-tả>
assert_status() {
  local expected="$1"
  local actual="$2"
  local desc="$3"

  if [ "$actual" -eq "$expected" ]; then
    echo -e "  ${GREEN}✓${RESET} $desc (HTTP $actual)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${RESET} $desc — mong đợi HTTP $expected, nhận HTTP $actual"
    FAIL=$((FAIL + 1))
  fi
}

# ── Kiểm tra API có sống không ───────────────────────────────────────────────
echo "Kiểm tra kết nối tới $BASE_URL ..."
if ! curl -sf "$BASE_URL/health" > /dev/null 2>&1; then
  echo ""
  echo "Lỗi: API không phản hồi tại $BASE_URL"
  echo ""
  echo "Hãy khởi động API trước:"
  echo "  1. docker compose up -d db          # khởi động PostgreSQL"
  echo "  2. cd api && npm run dev             # cần Node 22 (kiểm tra: node -v)"
  echo ""
  echo "Sau đó chạy lại: bash scripts/smoke-test.sh"
  exit 1
fi
echo "API đang chạy. Bắt đầu smoke-test..."
echo ""

# ── Dữ liệu test (timestamp để tránh xung đột nếu chạy nhiều lần) ───────────
TS=$(date +%s)
TITLE="Smoke Test Article $TS"
TAG_NAME="smoke-tag-$TS"
SEARCH_KEYWORD="Smoke"

# ── Kịch bản 1: Health check ─────────────────────────────────────────────────
echo "[1] Health check"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
assert_status 200 "$STATUS" "GET /health"

# ── Kịch bản 2: Lấy danh sách bài viết ──────────────────────────────────────
echo "[2] Danh sách bài viết"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/articles")
assert_status 200 "$STATUS" "GET /api/articles"

# ── Kịch bản 3: Tạo bài viết mới → bắt slug từ response ─────────────────────
echo "[3] Tạo bài viết mới"
BODY_CREATE=$(printf '{"title":"%s","content":"Nội dung thử nghiệm smoke test","tagIds":[]}' "$TITLE")
RESPONSE_CREATE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/articles" \
  -H "Content-Type: application/json" \
  -d "$BODY_CREATE")

STATUS=$(echo "$RESPONSE_CREATE" | tail -n1)
BODY=$(echo "$RESPONSE_CREATE" | sed '$d')
assert_status 201 "$STATUS" "POST /api/articles (tạo mới)"

# Dùng python3 để parse JSON lấy slug — không phụ thuộc jq
SLUG=$(echo "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin)['slug'])" 2>/dev/null || echo "")
if [ -z "$SLUG" ]; then
  echo -e "  ${RED}✗${RESET} Không thể lấy slug từ response — các bước tiếp theo sẽ bỏ qua"
  FAIL=$((FAIL + 1))
  SLUG="slug-khong-tim-duoc-$TS"
fi

# ── Kịch bản 4: Lấy chi tiết bài vừa tạo ────────────────────────────────────
echo "[4] Chi tiết bài viết"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/articles/$SLUG")
assert_status 200 "$STATUS" "GET /api/articles/$SLUG"

# ── Kịch bản 5: Tạo trùng title → 409 ───────────────────────────────────────
echo "[5] Tạo trùng title"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/articles" \
  -H "Content-Type: application/json" \
  -d "$BODY_CREATE")
assert_status 409 "$STATUS" "POST /api/articles (trùng title → 409)"

# ── Kịch bản 6: Cập nhật bài viết ───────────────────────────────────────────
# LƯU Ý: đổi title → API tự sinh lại slug (slug bám theo title). Vì vậy phải bắt
# slug MỚI từ response để các bước sau (xóa) dùng đúng — không thì DELETE slug cũ → 404.
echo "[6] Cập nhật bài viết"
TITLE_UPDATED="$TITLE Updated"
RESP=$(curl -s -w $'\n%{http_code}' -X PUT "$BASE_URL/api/articles/$SLUG" \
  -H "Content-Type: application/json" \
  -d "$(printf '{"title":"%s"}' "$TITLE_UPDATED")")
STATUS=$(printf '%s' "$RESP" | tail -n1)
BODY=$(printf '%s' "$RESP" | sed '$d')
assert_status 200 "$STATUS" "PUT /api/articles/$SLUG (đổi title → slug mới)"
NEW_SLUG=$(printf '%s' "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin)['slug'])" 2>/dev/null || echo "")
[ -n "$NEW_SLUG" ] && SLUG="$NEW_SLUG"

# ── Kịch bản 7: Tạo tag mới ──────────────────────────────────────────────────
echo "[7] Tạo tag mới"
RESPONSE_TAG=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/tags" \
  -H "Content-Type: application/json" \
  -d "$(printf '{"name":"%s"}' "$TAG_NAME")")
STATUS=$(echo "$RESPONSE_TAG" | tail -n1)
assert_status 201 "$STATUS" "POST /api/tags"

# ── Kịch bản 8: Tìm kiếm bằng từ khoá có trong bài ──────────────────────────
echo "[8] Tìm kiếm"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/api/search?q=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$SEARCH_KEYWORD'))")")
assert_status 200 "$STATUS" "GET /api/search?q=$SEARCH_KEYWORD"

# ── Kịch bản 9: Tìm kiếm thiếu tham số q → 400 ──────────────────────────────
echo "[9] Tìm kiếm thiếu q"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/search")
assert_status 400 "$STATUS" "GET /api/search (thiếu q → 400)"

# ── Kịch bản 10: Tạo bài thiếu title → 400 ──────────────────────────────────
echo "[10] Tạo bài thiếu title"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/articles" \
  -H "Content-Type: application/json" \
  -d '{"content":"Không có title"}')
assert_status 400 "$STATUS" "POST /api/articles (thiếu title → 400)"

# ── Kịch bản 11: Xóa bài viết ────────────────────────────────────────────────
echo "[11] Xóa bài viết"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/api/articles/$SLUG")
assert_status 204 "$STATUS" "DELETE /api/articles/$SLUG"

# ── Kịch bản 12: Lấy bài đã xóa → 404 ───────────────────────────────────────
echo "[12] Lấy bài đã xóa"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/articles/$SLUG")
assert_status 404 "$STATUS" "GET /api/articles/$SLUG (đã xóa → 404)"

# ── Tổng kết ─────────────────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────"
TOTAL=$((PASS + FAIL))
if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}Kết quả: $PASS/$TOTAL passed ✓ — tất cả kịch bản đạt${RESET}"
  exit 0
else
  echo -e "${RED}Kết quả: $PASS/$TOTAL passed, $FAIL failed ✗${RESET}"
  exit 1
fi
