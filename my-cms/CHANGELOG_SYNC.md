# 📝 CMS Sync Configuration - Changelog

## 🎯 Tổng quan thay đổi

Dọn dẹp và tối ưu hóa cấu hình sync giữa Backend API và Strapi CMS cho môi trường Docker.

---

## ✅ Các thay đổi chính

### 1. **Fix Dockerfile - Copy scripts vào image**
**Vấn đề:** Scripts không tồn tại trong production container  
**Giải pháp:** Thêm explicit check và comment trong Dockerfile

```dockerfile
# Copy source code and scripts
COPY . .

# Ensure scripts directory exists (needed for sync functionality)
RUN test -d scripts || mkdir -p scripts
```

### 2. **Đơn giản hóa biến môi trường**

#### ❌ **Loại bỏ:**
- `STRAPI_URL` - Không cần vì script chạy trong cùng container
- `STRAPI_API_TOKEN` - Không cần auth cho local connection
- `BACKEND_URL` - Đổi tên thành `BACKEND_API_URL` cho nhất quán
- `BACKEND_API_KEY` - Không cần vì chỉ dùng public endpoints

#### ✅ **Giữ lại:**
- `BACKEND_API_URL` - URL của Backend API
- `SYNC_ON_START` - Tùy chọn sync khi CMS start

### 3. **Cập nhật cho Docker network**

**Chỉ sử dụng public API endpoints:**
- `GET /v1/api/category/active` - Lấy categories
- `GET /v1/api/coupon/active` - Lấy coupons
- Không cần authentication

**Development:**
```bash
BACKEND_API_URL=http://localhost:3000
```

**Docker (Production):**
```bash
BACKEND_API_URL=http://backend:3000  # Dùng service name, HTTP không HTTPS
```

### 4. **Xóa scripts không cần thiết**

Đã xóa các scripts chỉ dùng cho development/testing:
- ❌ `test-strapi-connection.js` - Test external Strapi connection
- ❌ `test-backend-connection.js` - Test backend connection  
- ❌ `scheduler.js` - Duplicate cron job (đã có trong `src/index.ts`)
- ❌ `debug-backend-response.js` - Debug tool

Giữ lại:
- ✅ `sync-backend-data.js` - Core sync logic (được gọi bởi cron job)

### 5. **Cập nhật npm scripts**

**Trước:**
```json
"sync-backend": "...",
"sync-scheduler": "...",
"sync-scheduler-now": "...",
"test:backend": "...",
"test:strapi": "..."
```

**Sau:**
```json
"sync:all": "node scripts/sync-backend-data.js all",
"sync:categories": "node scripts/sync-backend-data.js categories", 
"sync:coupons": "node scripts/sync-backend-data.js coupons"
```

---

## 🔄 Cách hoạt động mới

### Development (Manual sync)
```bash
cd my-cms
npm run sync:all
```

### Production (Auto sync)
- **Tự động:** Cron job chạy mỗi 2 giờ (built-in `src/index.ts`)
- **Optional:** Set `SYNC_ON_START=true` để sync khi start
- **Không cần:** Manual scheduler hay external scripts

---

## 🚀 Rebuild Docker Image

**Sau khi update Dockerfile, cần rebuild:**

```bash
# Build lại image
docker build -t my-cms:latest ./my-cms

# Hoặc dùng GitHub Actions để build tự động
git add .
git commit -m "fix: CMS sync configuration for Docker"
git push
```

---

## 📋 Checklist Deploy

- [ ] Update file `.env` với `BACKEND_API_URL=http://backend:3000`
- [ ] Rebuild Docker image
- [ ] Restart CMS container
- [ ] Verify logs: `docker logs cms -f`
- [ ] Check sync hoạt động sau 2 giờ hoặc khi start (nếu `SYNC_ON_START=true`)

---

## 🐛 Troubleshooting

### "Sync script not found at /app/scripts/..."
→ Rebuild Docker image để include scripts folder

### "Backend connection failed"
→ Verify `BACKEND_API_URL` đúng (http://backend:3000 trong Docker)

### Sync không chạy tự động
→ Check `NODE_ENV=production` và xem logs khi CMS start

### "Backend không trả về array"
→ Verify backend endpoints `/v1/api/category/active` và `/v1/api/coupon/active` đang hoạt động

---

## 📚 Files thay đổi

```
my-cms/
├── Dockerfile                          # ✏️ Updated
├── package.json                        # ✏️ Updated (removed unused scripts)
├── QUICK_START_SCRIPTS.md              # ✏️ Updated docs
├── CHANGELOG_SYNC.md                   # ✨ New file (this)
└── scripts/
    ├── sync-backend-data.js            # ✏️ Updated (simplified auth)
    ├── test-strapi-connection.js       # ❌ Deleted
    ├── test-backend-connection.js      # ❌ Deleted
    ├── scheduler.js                    # ❌ Deleted
    └── debug-backend-response.js       # ❌ Deleted

deploy/env/
├── cms.env.example                     # ✏️ Updated (Docker URLs)
└── cms.kamatera.env.example            # ✏️ Updated (Docker URLs)
```

---

**Date:** 2026-01-04  
**Author:** Rovo Dev  
**Status:** ✅ Completed
