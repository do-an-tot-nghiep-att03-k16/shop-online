# 🚀 HƯỚNG DẪN DEPLOY CHI TIẾT

## 📋 Tổng quan
- **Backend + CMS + n8n:** Render (Docker + Auto Deploy)
- **Frontend:** Cloudflare Pages (Auto Deploy)
- **Repo:** Private ✅ (Render & Cloudflare hỗ trợ)
- **CI/CD:** GitHub Actions tự động build Docker images

---

## 🔧 BƯỚC 1: Build Docker Images (GitHub Actions)

### 1.1. Enable GitHub Actions
1. Vào: https://github.com/QingYunne/ecommerce-project/actions
2. Nếu Actions bị disable → Click **"I understand my workflows, go ahead and enable them"**

### 1.2. Chạy Build Workflow
1. Click workflow: **"Build and Push Docker Images (GHCR)"**
2. Click **"Run workflow"** dropdown → **"Run workflow"** button
3. Đợi ~5-7 phút để build 3 images:
   - `ghcr.io/qingyunne/online-clothing-store:latest`
   - `ghcr.io/qingyunne/my-cms:latest`
   - `ghcr.io/qingyunne/frontend-clothing-shop:latest`

### 1.3. Kiểm tra Images
Vào: https://github.com/QingYunne?tab=packages
- Phải thấy 3 packages được tạo
- Click vào mỗi package → **"Package settings"** → **"Change visibility"** → **Public** (để Render pull được)

---

## 🖥️ BƯỚC 2: Deploy Backend + CMS lên Render

### 2.1. Tạo MongoDB Database
1. Đăng ký MongoDB Atlas (miễn phí): https://www.mongodb.com/cloud/atlas/register
2. Tạo cluster mới (Free M0)
3. Database Access → Add User (username + password)
4. Network Access → Add IP Address → **0.0.0.0/0** (Allow from anywhere)
5. Copy connection string: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/clothing-shop?retryWrites=true&w=majority`

### 2.2. Tạo Secrets cho JWT
```bash
# Chạy trên terminal local
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # REFRESH_TOKEN_SECRET
openssl rand -base64 32  # N8N_ENCRYPTION_KEY (nếu dùng n8n)
```

### 2.3. Deploy với Render Blueprint
1. Đăng nhập Render: https://dashboard.render.com/register
2. Click **"New +"** → **"Blueprint"**
3. Chọn repository: **"QingYunne/ecommerce-project"**
   - Nếu chưa connect GitHub → Authorize Render GitHub App
4. Branch: **main**
5. Blueprint path: **render.yaml** (tự động detect)
6. Click **"Apply"**

### 2.4. Cấu hình GHCR Registry (quan trọng!)
Render cần credentials để pull Docker images từ GHCR.

#### Tạo GitHub Personal Access Token (PAT):
1. Vào: https://github.com/settings/tokens/new
2. Note: `render-ghcr-access`
3. Expiration: **90 days** (hoặc No expiration)
4. Scopes: ✅ **read:packages**
5. Click **"Generate token"** → **COPY TOKEN** (ghp_xxxxx)

#### Thêm Registry vào Render:
1. Vào mỗi service: **ocs-backend**, **ocs-cms**
2. **Settings** → **Registry**
3. Điền:
   - Registry URL: `ghcr.io`
   - Username: `QingYunne`
   - Password: Paste token `ghp_xxxxx` vừa tạo
4. **Save**

### 2.5. Cấu hình Environment Variables
Vào từng service và set env vars:

#### **ocs-backend:**
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/clothing-shop
JWT_SECRET=<từ step 2.2>
REFRESH_TOKEN_SECRET=<từ step 2.2>
CORS_ORIGINS=https://your-frontend.pages.dev
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASS=your-app-password
SEPAY_WEBHOOK_SECRET=<tùy chọn>
```

#### **ocs-cms:**
- Không cần set gì thêm (dùng SQLite mặc định)
- Hoặc nâng cấp Postgres (tốn phí): Set `DATABASE_CLIENT=postgres` + `DATABASE_URL`

#### **ocs-n8n** (optional):
```env
N8N_HOST=your-n8n-subdomain.onrender.com
N8N_ENCRYPTION_KEY=<từ step 2.2>
WEBHOOK_URL=https://your-n8n-subdomain.onrender.com/
```

### 2.6. Deploy
1. Sau khi set env vars → Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Đợi ~5-10 phút
3. Check logs để đảm bảo không có lỗi
4. Lưu URL của backend: `https://ocs-backend.onrender.com`

---

## ☁️ BƯỚC 3: Deploy Frontend lên Cloudflare Pages

### 3.1. Đăng nhập Cloudflare
1. Vào: https://dash.cloudflare.com
2. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**

### 3.2. Connect GitHub
1. Chọn repository: **QingYunne/ecommerce-project**
2. Click **"Begin setup"**

### 3.3. Cấu hình Build
```
Project name: clothing-shop-frontend (hoặc tên tùy ý)
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: frontend-clothing-shop
```

### 3.4. Environment Variables (Production)
Click **"Add variable"** và thêm:
```env
NODE_VERSION=20
VITE_API_BASE_URL=https://ocs-backend.onrender.com/v1/api
VITE_API_STRAPI_URL=https://ocs-cms.onrender.com/api
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_N8N_WEBHOOK_URL=<optional>
```

### 3.5. Deploy
1. Click **"Save and Deploy"**
2. Đợi ~3-5 phút
3. Lưu URL: `https://clothing-shop-frontend.pages.dev`

### 3.6. Cập nhật CORS trên Backend
1. Quay lại Render → **ocs-backend** → **Environment**
2. Sửa `CORS_ORIGINS`:
   ```
   https://clothing-shop-frontend.pages.dev,https://*.pages.dev
   ```
3. Save → Redeploy

---

## ✅ BƯỚC 4: Kiểm tra & Test

### 4.1. Health Checks
- Backend: `https://ocs-backend.onrender.com/v1/api/jobs/health`
- CMS: `https://ocs-cms.onrender.com/_health`
- Frontend: `https://clothing-shop-frontend.pages.dev`

### 4.2. Test Features
1. Mở frontend URL
2. Đăng ký tài khoản mới
3. Browse products
4. Add to cart
5. Checkout

### 4.3. Check Logs
- Render: Click vào service → **Logs**
- Cloudflare: **Deployments** → Click deployment → **View build logs**

---

## 🔄 CI/CD Tự động

### Workflow đã setup:
1. **Push code** → `main` branch
2. **GitHub Actions** tự động build Docker images → GHCR
3. **Render** tự động pull image mới → redeploy backend/CMS
4. **Cloudflare Pages** tự động build → deploy frontend

### Kiểm tra:
```bash
# Make a small change
echo "# Test CI/CD" >> README.md
git add README.md
git commit -m "test: CI/CD pipeline"
git push origin main

# Check workflows
# GitHub: https://github.com/QingYunne/ecommerce-project/actions
# Render: Auto deploy trong ~5 phút
# Cloudflare: Auto deploy trong ~3 phút
```

---

## 🔒 Private Repo Notes

✅ **Đã hỗ trợ:**
- GitHub Actions: Tự động với private repo
- Render: Cần authorize GitHub App (đã làm ở step 2.3)
- Cloudflare Pages: Cần authorize GitHub App (đã làm ở step 3.2)

❌ **Lưu ý:**
- GHCR images phải **public** để Render pull được (hoặc dùng registry credentials như đã setup)

---

## 🆘 Troubleshooting

### Lỗi: "Failed to pull image from GHCR"
→ Đảm bảo:
1. Images trên GHCR là **public**
2. Hoặc đã thêm **Registry credentials** đúng trong Render

### Lỗi: "CORS policy"
→ Cập nhật `CORS_ORIGINS` trong backend env vars:
```
https://your-frontend.pages.dev,https://*.pages.dev
```

### Lỗi: "MongoDB connection failed"
→ Kiểm tra:
1. IP Whitelist: Phải có `0.0.0.0/0`
2. Username/password đúng
3. Connection string format đúng

### Frontend không load được API
→ Kiểm tra env vars trên Cloudflare Pages:
1. **Settings** → **Environment variables**
2. Đảm bảo `VITE_API_BASE_URL` đúng
3. Redeploy: **Deployments** → **Retry deployment**

---

## 📚 Tài liệu tham khảo
- Render Blueprint: https://render.com/docs/infrastructure-as-code
- Cloudflare Pages: https://developers.cloudflare.com/pages/
- GitHub Actions: https://docs.github.com/en/actions
- GHCR: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry
