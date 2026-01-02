#!/bin/bash

# ============================================
# Script test tốc độ pull Docker images từ GHCR
# ============================================

set -e

echo "🚀 Testing Docker image pull speed from GHCR..."
echo ""

# Nhập GitHub username
read -p "Enter your GitHub username (lowercase): " GITHUB_OWNER
GITHUB_OWNER=$(echo "$GITHUB_OWNER" | tr '[:upper:]' '[:lower:]')

echo ""
echo "📦 Images to test:"
echo "  - ghcr.io/$GITHUB_OWNER/online-clothing-store:latest"
echo "  - ghcr.io/$GITHUB_OWNER/frontend-clothing-shop:latest"
echo "  - ghcr.io/$GITHUB_OWNER/my-cms:latest"
echo ""

# Xóa images cũ để test pull từ đầu
echo "🧹 Cleaning old images..."
docker rmi ghcr.io/$GITHUB_OWNER/online-clothing-store:latest 2>/dev/null || true
docker rmi ghcr.io/$GITHUB_OWNER/frontend-clothing-shop:latest 2>/dev/null || true
docker rmi ghcr.io/$GITHUB_OWNER/my-cms:latest 2>/dev/null || true

echo ""
echo "⏱️  Starting pull test..."
echo "=========================================="

# Test Backend
echo ""
echo "📥 [1/3] Pulling Backend..."
START=$(date +%s)
docker pull ghcr.io/$GITHUB_OWNER/online-clothing-store:latest
END=$(date +%s)
BACKEND_TIME=$((END - START))
BACKEND_SIZE=$(docker images ghcr.io/$GITHUB_OWNER/online-clothing-store:latest --format "{{.Size}}")
echo "✅ Backend: ${BACKEND_TIME}s (Size: $BACKEND_SIZE)"

# Test Frontend
echo ""
echo "📥 [2/3] Pulling Frontend..."
START=$(date +%s)
docker pull ghcr.io/$GITHUB_OWNER/frontend-clothing-shop:latest
END=$(date +%s)
FRONTEND_TIME=$((END - START))
FRONTEND_SIZE=$(docker images ghcr.io/$GITHUB_OWNER/frontend-clothing-shop:latest --format "{{.Size}}")
echo "✅ Frontend: ${FRONTEND_TIME}s (Size: $FRONTEND_SIZE)"

# Test CMS
echo ""
echo "📥 [3/3] Pulling CMS..."
START=$(date +%s)
docker pull ghcr.io/$GITHUB_OWNER/my-cms:latest
END=$(date +%s)
CMS_TIME=$((END - START))
CMS_SIZE=$(docker images ghcr.io/$GITHUB_OWNER/my-cms:latest --format "{{.Size}}")
echo "✅ CMS: ${CMS_TIME}s (Size: $CMS_SIZE)"

# Tính tổng
TOTAL_TIME=$((BACKEND_TIME + FRONTEND_TIME + CMS_TIME))

echo ""
echo "=========================================="
echo "📊 SUMMARY:"
echo "=========================================="
echo "Backend:   ${BACKEND_TIME}s  ($BACKEND_SIZE)"
echo "Frontend:  ${FRONTEND_TIME}s ($FRONTEND_SIZE)"
echo "CMS:       ${CMS_TIME}s  ($CMS_SIZE)"
echo "----------------------------------------"
echo "TOTAL:     ${TOTAL_TIME}s"
echo ""

# Đánh giá tốc độ
if [ $TOTAL_TIME -lt 60 ]; then
    echo "🚀 EXCELLENT! Pull speed is very fast!"
elif [ $TOTAL_TIME -lt 120 ]; then
    echo "✅ GOOD! Pull speed is acceptable."
elif [ $TOTAL_TIME -lt 300 ]; then
    echo "⚠️  MODERATE. Consider using better network."
else
    echo "🐌 SLOW. Check your network connection."
fi

echo ""
echo "💡 Note: Next pulls will be MUCH faster (only changed layers)."
echo ""

# Test pull lần 2 (với cache)
echo "🔄 Testing CACHED pull (to simulate updates)..."
sleep 2

START=$(date +%s)
docker pull ghcr.io/$GITHUB_OWNER/online-clothing-store:latest >/dev/null 2>&1
END=$(date +%s)
CACHED_TIME=$((END - START))

echo "✅ Cached pull: ${CACHED_TIME}s"
echo ""
echo "📈 Speed improvement: $((TOTAL_TIME / CACHED_TIME))x faster with cache!"
echo ""

echo "=========================================="
echo "✅ Test completed!"
echo "=========================================="
