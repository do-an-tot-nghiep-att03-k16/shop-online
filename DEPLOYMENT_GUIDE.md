# 🚀 Deployment Guide - Aristia Shop

Hướng dẫn deploy toàn bộ hệ thống lên Render + Cloudflare Pages.

## 📋 Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────┐
│  Cloudflare Pages (Frontend)                    │
│  - React + Vite                                 │
│  - Auto deploy from GitHub                      │
└─────────────────────────────────────────────────┘
                    ↓ API calls
┌─────────────────────────────────────────────────┐
│  Render Services                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Backend (Node.js + Express)              │  │
│  │ - Docker from GHCR                       │  │
│  │ - Health check: /v1/api/jobs/health      │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ CMS (Strapi)                             │  │
│  │ - Docker from GHCR                       │  │
│  │ - SQLite + persistent disk               │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ n8n (Automation)                         │  │
│  │ - Docker (n8nio/n8n:latest)             │  │
│  │ - Postgres database + persistent disk    │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ Redis (Managed)                          │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  MongoDB Atlas (Database)                       │
└─────────────────────────────────────────────────┘
```

## 🎯 Bước 1: Chuẩn bị (Chỉ làm 1 lần)

### 1.1. Tạo GitHub Repository

```bash
# Tạo repo mới trên GitHub (https://github.com/new)
# Tên: aristia-shop (hoặc tên bạn thích)
# Visibility: Private (khuyến nghị) hoặc Public

# Trên máy local (trong thư mục project)
git init
git add .
git commit -m "Initial commit: Full stack e-commerce with deployment configs"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/aristia-shop.git
git push -u origin main
```

### 1.2. Setup MongoDB Atlas

```bash
# 1. Tạo account: https://www.mongodb.com/cloud/atlas/register
# 2. Tạo cluster (Free tier M0)
# 3. Database Access → Add user (username + password)
# 4. Network Access → Add IP (0.0.0.0/0 cho Render)
# 5. Copy connection string:
#    mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/clothing?retryWrites=true&w=majority
```

### 1.3. Generate Secrets

```bash
# JWT Secrets (2 cái)
openssl rand -hex 64

# n8n Encryption Key
openssl rand -base64 32

# Strapi secrets (nếu chưa có)
openssl rand -base64 32  # APP_KEYS (4 keys, comma-separated)
openssl rand -base64 32  # API_TOKEN_SALT
openssl rand -base64 32  # ADMIN_JWT_SECRET
```

## 🚀 Bước 2: Deploy lên Render

### 2.1. Tạo Render Account

1. Đăng ký: https://dashboard.render.com/register
2. Connect GitHub account
3. Authorize Render to access your repo

### 2.2. Deploy từ Blueprint (render.yaml)

1. Dashboard → **New** → **Blueprint**
2. Connect repository: `your-username/aristia-shop`
3. Branch: `main`
4. Render sẽ tự phát hiện `render.yaml`
5. Click **Apply**

### 2.3. Configure Environment Variables

**Backend (ocs-backend):**
```
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxx.mongodb.net/clothing
JWT_SECRET=<your-64-char-hex>
REFRESH_TOKEN_SECRET=<your-64-char-hex>
CORS_ORIGINS=https://your-site.pages.dev,https://yourdomain.com
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASS=<app-password>
SEPAY_WEBHOOK_SECRET=<your-sepay-secret>
```

**CMS (ocs-cms):**
```
# SQLite (demo) - đã set sẵn
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# Hoặc Postgres (production)
# DATABASE_CLIENT=postgres
# DATABASE_URL=<render-postgres-url>

APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=<base64-32>
ADMIN_JWT_SECRET=<base64-32>
```

**n8n (ocs-n8n):**
```
N8N_HOST=n8n.yourdomain.com
WEBHOOK_URL=https://n8n.yourdomain.com/
N8N_ENCRYPTION_KEY=<base64-32>
```

### 2.4. Đợi deploy xong (5-10 phút)

- Render sẽ pull images từ GHCR
- Tạo databases, Redis, volumes
- Start tất cả services

## 🌐 Bước 3: Deploy Frontend lên Cloudflare Pages

### 3.1. Tạo Cloudflare Pages

1. Đăng nhập: https://dash.cloudflare.com/
2. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Select repository: `aristia-shop`
4. Configure build:
   - **Framework preset:** None
   - **Build command:** `cd frontend-clothing-shop && npm ci && npm run build`
   - **Build output directory:** `frontend-clothing-shop/dist`
   - **Root directory:** `/`

### 3.2. Environment Variables (Pages)

```
VITE_API_BASE_URL=https://ocs-backend.onrender.com/v1/api
VITE_API_STRAPI_URL=https://ocs-cms.onrender.com/api
VITE_N8N_WEBHOOK_URL=https://ocs-n8n.onrender.com/webhook/<your-webhook-id>
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-key>
```

**Lưu ý:** Thay `ocs-backend.onrender.com` bằng domain Render cung cấp

### 3.3. Deploy

Click **Save and Deploy** → Cloudflare sẽ build và deploy (2-3 phút)

## 🔧 Bước 4: Custom Domains (Tùy chọn)

### 4.1. Cloudflare Pages

1. Pages → **Custom domains** → **Set up a custom domain**
2. Nhập domain: `aristia.shop` hoặc `www.aristia.shop`
3. Cloudflare tự động config DNS

### 4.2. Render Services

**Backend:**
1. Service `ocs-backend` → **Settings** → **Custom Domain**
2. Add: `api.yourdomain.com`
3. Copy CNAME value
4. Vào Cloudflare DNS → Add CNAME: `api` → `<render-value>`

**CMS:**
1. Service `ocs-cms` → Add: `cms.yourdomain.com`
2. Cloudflare DNS → CNAME: `cms` → `<render-value>`

**n8n:**
1. Service `ocs-n8n` → Add: `n8n.yourdomain.com`
2. Cloudflare DNS → CNAME: `n8n` → `<render-value>`

### 4.3. Update Frontend Env

Sau khi có custom domains, update env trên Cloudflare Pages:
```
VITE_API_BASE_URL=https://api.yourdomain.com/v1/api
VITE_API_STRAPI_URL=https://cms.yourdomain.com/api
VITE_N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/<id>
```

Redeploy Pages để áp dụng.

## 🔐 Bước 5: Bảo mật

### 5.1. Rotate tất cả secrets trong repo

**⚠️ QUAN TRỌNG:** Các file `.env` trong repo có thể chứa secrets cũ:
- `online-clothing-store/.env`
- `my-cms/.env`
- `frontend-clothing-shop/.env`

**Phải làm:**
1. Rotate tất cả secrets (MongoDB password, JWT, API keys, Cloudinary, AWS...)
2. Xóa `.env` khỏi Git history:
   ```bash
   # Install BFG
   brew install bfg  # macOS
   # hoặc download: https://rtyley.github.io/bfg-repo-cleaner/
   
   # Backup repo
   cp -r . ../aristia-shop-backup
   
   # Remove .env from history
   bfg --delete-files .env
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   
   # Force push
   git push origin --force --all
   ```

3. Hoặc đơn giản: tạo repo mới, chỉ commit code sạch (không có `.env`)

### 5.2. GitHub Secrets

Settings → Secrets and variables → Actions → New repository secret:
- `GHCR_TOKEN`: Personal Access Token (với quyền `write:packages`)

### 5.3. Render Environment Security

- Tất cả sensitive values → Environment Variables (không hardcode)
- Enable "Deploy on push" cho auto deploy

## ✅ Bước 6: Verify Deployment

### 6.1. Check Services

**Render Dashboard:**
- ✅ ocs-backend: Status "Live", logs không có error
- ✅ ocs-cms: Status "Live"
- ✅ ocs-n8n: Status "Live"
- ✅ ocs-redis: Status "Available"
- ✅ ocs-n8n-db: Status "Available"

**Test Health:**
```bash
curl https://api.yourdomain.com/v1/api/jobs/health
# Expect: 200 OK

curl https://cms.yourdomain.com/_health
# Expect: 200 OK

curl https://n8n.yourdomain.com/healthz
# Expect: 200 OK
```

### 6.2. Check Frontend

Truy cập: https://your-site.pages.dev hoặc https://yourdomain.com
- ✅ Trang home load được
- ✅ Products hiển thị (gọi backend)
- ✅ Console không có lỗi CORS

### 6.3. Setup n8n

1. Truy cập: https://n8n.yourdomain.com
2. Tạo admin account (lần đầu)
3. Tạo workflow chatbot
4. Copy webhook URL → update `VITE_N8N_WEBHOOK_URL`

## 🔄 Bước 7: CI/CD Automation

**Workflow đã setup:**
- Push to `main` → GitHub Actions build images → Push to GHCR
- Render auto pull images mới → Deploy

**Test:**
```bash
# Thay đổi code
echo "console.log('test')" >> online-clothing-store/src/app.js

# Commit và push
git add .
git commit -m "test: CI/CD"
git push origin main

# Xem GitHub Actions: https://github.com/YOUR_USERNAME/aristia-shop/actions
# Xem Render logs: Dashboard → Service → Logs
```

## 📦 Bước 8: Setup Backup (chỉ cho EC2/VPS)

Nếu bạn self-host trên EC2:
```bash
cd deploy/scripts
sudo ./setup-n8n-backup-cron.sh
```

Trên Render:
- Postgres: Auto backup (point-in-time recovery)
- Disks: Persistent, nhưng nên export workflows định kỳ từ n8n UI

## 📊 Monitoring

### Render Dashboard
- Service logs: Real-time
- Metrics: CPU, Memory, Response time
- Alerts: Email notifications

### Cloudflare Pages
- Analytics: Visitors, bandwidth
- Deployment logs
- Real User Monitoring (RUM)

## 🆘 Troubleshooting

### Build thất bại

**GitHub Actions:**
- Check logs: Actions → failed workflow → View logs
- Thường do: missing secrets, syntax error

**Cloudflare Pages:**
- Check build log
- Thường do: wrong build command, missing env vars

### Service không start

**Render:**
- Check logs: Service → Logs tab
- Thường do: missing env vars, connection to DB failed

### CORS errors

- Check `CORS_ORIGINS` trong backend env
- Phải bao gồm frontend domain (Pages)

### Database connection failed

- Check MongoDB Atlas:
  - Network Access: 0.0.0.0/0 allowed?
  - Database User: password correct?
  - Connection string: correct format?

## 📞 Support

- Render Docs: https://render.com/docs
- Cloudflare Pages: https://developers.cloudflare.com/pages
- MongoDB Atlas: https://docs.atlas.mongodb.com

## 🎉 Done!

Sau các bước trên, hệ thống của bạn đã:
- ✅ Deploy full stack trên cloud
- ✅ Auto build/deploy khi push code
- ✅ HTTPS/SSL tự động
- ✅ Database managed & backed up
- ✅ Scalable & production-ready

**URL truy cập:**
- Frontend: https://yourdomain.com
- API: https://api.yourdomain.com
- CMS: https://cms.yourdomain.com
- n8n: https://n8n.yourdomain.com

Happy deploying! 🚀
