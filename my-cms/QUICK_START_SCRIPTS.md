# 🚀 Quick Start - CMS Scripts

## ⚡ TL;DR

```bash
cd my-cms
cp .env.example .env
# Edit .env với BACKEND_API_URL (default: http://localhost:3000)
npm run sync:all
```

---

## 📋 Available Commands

### 🔄 Manual Sync (Development/Testing)
```bash
npm run sync:all           # Sync tất cả (categories + coupons)
npm run sync:categories    # Chỉ sync categories
npm run sync:coupons       # Chỉ sync coupons
```

### ⏰ Auto Sync (Production)
**Tự động chạy khi CMS start trong production mode:**
- Cron job mỗi 2 giờ (built-in trong `src/index.ts`)
- Optional: Set `SYNC_ON_START=true` để sync ngay khi start

---

## 🔑 Required Environment Variables

```bash
# my-cms/.env (for development)
BACKEND_API_URL=http://localhost:3000

# For Docker deployment, use service name:
# BACKEND_API_URL=http://backend:3000
```

**Note:** Chỉ sử dụng public API endpoints, không cần API key

---

## 🛠️ Troubleshooting

### ❌ "Backend connection failed"
→ Check if backend server is running (localhost:3000 or backend:3000 in Docker)

### ❌ "Sync script not found"
→ Rebuild Docker image to include scripts folder

### ❌ "404 Content type not found"
→ Create Categories and Coupons content types in Strapi first

### ❌ "Backend không trả về array"
→ Verify backend endpoints `/v1/api/category/active` và `/v1/api/coupon/active` hoạt động

---

## 📚 How It Works

1. **Development:** Run manual sync commands to test
2. **Production (Docker):** Auto-sync enabled via cron job in `src/index.ts`
   - Runs every 2 hours automatically
   - Syncs categories & coupons from Backend API → Strapi CMS
   - Uses internal Docker network: `http://backend:3000`

## 🐳 Docker Network Configuration

```bash
# Inside Docker, services communicate via service names:
BACKEND_API_URL=http://backend:3000  # NOT localhost, NOT HTTPS

# No need for STRAPI_URL or STRAPI_API_TOKEN
# Scripts run inside the same container as Strapi
```

---

**⚠️ Important:** 
- Manual sync commands run from `my-cms/` directory
- Docker auto-sync requires rebuilding image after Dockerfile changes
