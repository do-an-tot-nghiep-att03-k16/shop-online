#!/bin/bash
# Script setup Git và push lên GitHub - Chạy 1 lần duy nhất

echo "=========================================="
echo "🚀 Setup Git & Push to GitHub"
echo "=========================================="

# Bước 1: Init git
echo "[1/4] Initializing Git repository..."
git init
git branch -M main
echo "✓ Git initialized"

# Bước 2: Add all files
echo "[2/4] Adding all files..."
git add .
echo "✓ Files added"

# Bước 3: First commit
echo "[3/4] Creating initial commit..."
git commit -m "feat: Initial commit - Full stack e-commerce with Render/Cloudflare deployment

- Frontend: React + Vite (Cloudflare Pages ready)
- Backend: Node.js + Express (Render ready)  
- CMS: Strapi 5 (Render ready)
- n8n: Workflow automation (Render ready)
- CI/CD: GitHub Actions → GHCR
- Deployment configs: render.yaml, docker-compose.yml
- Backup scripts: n8n PostgreSQL + volume backup
- Security: .env ignored, API keys removed from frontend"
echo "✓ Initial commit created"

# Bước 4: Hướng dẫn push
echo ""
echo "=========================================="
echo "✅ Git setup hoàn tất!"
echo "=========================================="
echo ""
echo "📌 BÂY GIỜ LÀM THEO:"
echo ""
echo "1. Tạo GitHub repo mới:"
echo "   → Mở: https://github.com/new"
echo "   → Tên: aristia-shop (hoặc tên bạn thích)"
echo "   → Visibility: Private"
echo "   → KHÔNG TICK 'Add README' (để trống hết)"
echo "   → Click 'Create repository'"
echo ""
echo "2. Copy 2 lệnh này và chạy (thay YOUR_USERNAME):"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/aristia-shop.git"
echo "   git push -u origin main"
echo ""
echo "3. Sau đó đọc file DEPLOYMENT_GUIDE.md để deploy lên Render"
echo ""
echo "=========================================="
