# ✅ Render Deployment Checklist

## 🎯 Trạng thái hiện tại

- ✅ Code đã fix (PostgreSQL support)
- ✅ Đã commit và push
- 🔄 GitHub Actions đang build Docker image
- ⏳ Đợi image build xong để deploy

---

## 📋 Checklist để deploy CMS lên Render

### 1. Tạo PostgreSQL Database

- [ ] Vào Render Dashboard → **New** → **PostgreSQL**
- [ ] Cấu hình:
  - Name: `cms-database`
  - Database: `strapi_cms`
  - User: `strapi_user`
  - Region: **Singapore** (hoặc gần nhất)
  - Plan: **Free** hoặc **Starter**
- [ ] Sau khi tạo, copy **Internal Database URL**
- [ ] Format: `postgresql://strapi_user:xxx@dpg-xxx.singapore-postgres.render.com/strapi_cms`

---

### 2. Generate Security Keys

- [ ] Chạy script local:
  ```bash
  ./tmp_rovodev_generate_keys.sh
  ```
- [ ] Copy output và lưu vào file text an toàn
- [ ] Cần các keys sau:
  - `APP_KEYS` (4 keys cách nhau bởi dấu phẩy)
  - `API_TOKEN_SALT`
  - `ADMIN_JWT_SECRET`
  - `JWT_SECRET`
  - `TRANSFER_TOKEN_SALT`

---

### 3. Tạo Web Service cho CMS

- [ ] Render Dashboard → **New** → **Web Service**
- [ ] **Docker** mode
- [ ] Connect repository: `qingyunne/ecommerce-project`
- [ ] Cấu hình:
  - Name: `my-cms` (hoặc tên bạn muốn)
  - Region: **Singapore**
  - Branch: `main`
  - Root Directory: `my-cms`
  - Docker Image: Sử dụng image từ GHCR
    - **Registry Credentials**:
      - Registry: `ghcr.io`
      - Username: `qingyunne`
      - Password: GitHub Personal Access Token (PAT)
    - **Image URL**: `ghcr.io/qingyunne/my-cms:latest`
  - Instance Type: **Starter** ($7/month) hoặc **Free**

---

### 4. Cấu hình Environment Variables

Vào service → **Environment** tab → Add các biến sau:

```bash
# Basic
NODE_ENV=production
HOST=0.0.0.0
PORT=10000

# Database
DATABASE_CLIENT=postgres
DATABASE_URL=<paste_from_step_1>
DATABASE_SSL=true

# Security Keys (paste from step 2)
APP_KEYS=<key1,key2,key3,key4>
API_TOKEN_SALT=<your_salt>
ADMIN_JWT_SECRET=<your_admin_secret>
JWT_SECRET=<your_jwt_secret>
TRANSFER_TOKEN_SALT=<your_transfer_salt>
```

**Hoặc link database:**
- [ ] Environment tab → **Link Service**
- [ ] Chọn PostgreSQL database đã tạo ở bước 1
- [ ] Render sẽ tự động inject `${{Postgres.DATABASE_URL}}`

---

### 5. Deploy và Monitor

- [ ] Click **Manual Deploy** (hoặc đợi auto-deploy)
- [ ] Xem **Logs** tab để theo dõi:
  - ✅ Pull Docker image thành công
  - ✅ Container started
  - ✅ Database connected
  - ✅ "Server started on port 10000"
  - ✅ "Admin panel is available"

---

### 6. Setup Admin và Import Data

#### A. Truy cập Admin Panel

- [ ] Truy cập: `https://your-cms-name.onrender.com/admin`
- [ ] Tạo **first admin account**
- [ ] Login thành công

#### B. Tạo Transfer Token (để import data)

- [ ] Settings → API Tokens → **Transfer Tokens**
- [ ] Create new token
- [ ] Name: `transfer-token`
- [ ] Copy token và lưu lại

#### C. Transfer data từ local

**Option 1: Transfer trực tiếp (Khuyến nghị)**

```bash
# 1. Chạy CMS local với SQLite
cd my-cms
npm run dev

# 2. Tạo transfer token trên local
# http://localhost:1337/admin → Settings → Transfer Tokens → Create

# 3. Transfer từ local → Render
npx strapi transfer \
  --from http://localhost:1337 \
  --from-token <local_token> \
  --to https://your-cms.onrender.com \
  --to-token <render_token> \
  --force
```

**Option 2: Export/Import**

```bash
# 1. Export từ local
cd my-cms
npx strapi export --no-encrypt --file backup-cms

# 2. Upload file backup-cms.tar.gz
# 3. SSH hoặc dùng Render Shell để import
npx strapi import --file backup-cms --force
```

---

### 7. Verify Deployment

- [ ] Truy cập admin panel thành công
- [ ] Check Content Manager:
  - [ ] Blogs có dữ liệu
  - [ ] Categories có dữ liệu
  - [ ] Coupons có dữ liệu
  - [ ] Home Configuration có dữ liệu
  - [ ] Settings có dữ liệu
- [ ] Check Media Library:
  - [ ] Hình ảnh đã upload
- [ ] Test API endpoints:
  ```bash
  curl https://your-cms.onrender.com/api/blogs
  curl https://your-cms.onrender.com/api/categories
  ```

---

## 🔧 Troubleshooting

### ❌ "Health check failed"

**Nguyên nhân:** CMS chưa khởi động xong hoặc crash

**Giải pháp:**
1. Check Logs tab để xem lỗi cụ thể
2. Verify environment variables đầy đủ
3. Check DATABASE_URL đúng chưa

### ❌ "APP_KEYS is required"

**Nguyên nhân:** Thiếu hoặc sai format APP_KEYS

**Giải pháp:**
```bash
# Format đúng:
APP_KEYS=key1,key2,key3,key4
# KHÔNG có khoảng trắng!
# KHÔNG có dấu ngoặc kép!
```

### ❌ "Cannot connect to database"

**Nguyên nhân:** DATABASE_URL sai hoặc SSL config lỗi

**Giải pháp:**
1. Verify DATABASE_URL từ PostgreSQL service
2. Đảm bảo `DATABASE_SSL=true`
3. Check database service đang running

### ❌ "Image pull failed"

**Nguyên nhân:** GitHub Container Registry private hoặc credentials sai

**Giải pháp:**
1. Check image public trên GitHub:
   - https://github.com/QingYunne/ecommerce-project/pkgs/container/my-cms
   - Settings → Package visibility → Public
2. Hoặc add Registry Credentials trên Render:
   - Registry: `ghcr.io`
   - Username: `qingyunne`
   - Password: GitHub Personal Access Token (PAT)

---

## 📚 Tài liệu tham khảo

- [MIGRATION_TO_RENDER.md](./MIGRATION_TO_RENDER.md) - Chi tiết migration
- [RENDER_CMS_TROUBLESHOOTING.md](./RENDER_CMS_TROUBLESHOOTING.md) - Debug guide
- [RENDER_ENV_TEMPLATE.md](./RENDER_ENV_TEMPLATE.md) - Environment variables
- [Strapi Deployment](https://docs.strapi.io/dev-docs/deployment)
- [Render Docker](https://render.com/docs/docker)

---

## 🎉 Success Criteria

✅ CMS đang chạy trên Render
✅ Admin panel truy cập được
✅ Database PostgreSQL hoạt động
✅ Dữ liệu đã được migrate
✅ API endpoints respond đúng
✅ Media files hiển thị

**Chúc mừng! CMS đã production-ready! 🚀**

---

## 📝 Notes

- Free tier của Render có 750 giờ/tháng cho tất cả services
- PostgreSQL Free có limit 1GB storage
- Web Service Free sẽ spin down sau 15 phút không hoạt động
- Khuyến nghị upgrade lên Starter ($7/month) cho production
