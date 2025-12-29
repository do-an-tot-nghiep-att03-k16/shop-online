# 🚀 Hướng dẫn Migration & Deploy lên Render

Hướng dẫn chi tiết migrate dữ liệu và deploy CMS + n8n lên Render.

---

## 📋 Mục lục

1. [CMS: Migration SQLite → PostgreSQL](#1-cms-migration-sqlite--postgresql)
2. [n8n: Migration SQLite → Supabase PostgreSQL](#2-n8n-migration-sqlite--supabase-postgresql)
3. [Biến môi trường cho Render](#3-biến-môi-trường-cho-render)
4. [Troubleshooting](#4-troubleshooting)

---

## 1. CMS: Migration SQLite → PostgreSQL

### 📦 Bước 1: Export dữ liệu từ SQLite (Local)

```bash
# Di chuyển vào thư mục CMS
cd my-cms

# Export tất cả dữ liệu (không mã hóa để dễ debug)
npx strapi export --no-encrypt --file backup-cms-$(date +%Y%m%d)

# File output: backup-cms-YYYYMMDD.tar.gz
```

**Dữ liệu được export:**
- ✅ Content (blogs, categories, coupons, settings, home-configuration)
- ✅ Config (cấu hình hệ thống)
- ✅ Media files (hình ảnh, uploads)
- ✅ Users & roles

### 🗄️ Bước 2: Chuẩn bị PostgreSQL trên Render

**2.1. Tạo PostgreSQL database:**
1. Vào Render Dashboard → New → PostgreSQL
2. Name: `cms-database`
3. Database: `strapi_cms`
4. User: `strapi_user`
5. Region: Singapore/Nearest
6. Instance Type: Free hoặc Starter
7. Tạo và copy **Internal Database URL**

**2.2. Lưu connection string:**
```
postgresql://strapi_user:xxxxx@dpg-xxxxx.singapore-postgres.render.com/strapi_cms
```

### ⚙️ Bước 3: Deploy CMS lên Render

**3.1. Tạo Web Service:**
1. Render Dashboard → New → Web Service
2. Connect repository của bạn
3. Cấu hình:
   - Name: `my-cms`
   - Root Directory: `my-cms`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

**3.2. Thêm biến môi trường:**

```bash
# Production
NODE_ENV=production
HOST=0.0.0.0
PORT=10000

# Database - PostgreSQL
DATABASE_CLIENT=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Security Keys (generate mới - xem phần 3)
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=your_random_salt_32_chars
ADMIN_JWT_SECRET=your_random_secret_32_chars
JWT_SECRET=your_jwt_secret_32_chars
TRANSFER_TOKEN_SALT=your_transfer_salt_32_chars
```

**3.3. Deploy và đợi:**
- Deploy sẽ tạo database schema tự động
- Đợi CMS khởi động thành công
- Truy cập `https://your-cms.onrender.com/admin`
- Tạo admin user đầu tiên

### 📥 Bước 4: Import dữ liệu vào PostgreSQL

**Phương án A: Upload và import trực tiếp trên Render**

```bash
# Cách 1: Dùng Render Shell (nếu có)
# Upload file backup-cms-YYYYMMDD.tar.gz lên server
# Sau đó chạy:
npx strapi import --file backup-cms-YYYYMMDD --force
```

**Phương án B: Transfer từ local (Khuyến nghị)** ✅

```bash
# Bước 1: Tạo Transfer Token trên Render CMS
# Vào: https://your-cms.onrender.com/admin
# Settings → API Tokens → Transfer Tokens → Create new token
# Copy token: abc123xyz...

# Bước 2: Chạy CMS local với SQLite
cd my-cms
npm run dev

# Bước 3: Tạo Transfer Token cho local
# Vào: http://localhost:1337/admin
# Settings → API Tokens → Transfer Tokens → Create new token
# Copy token: local456def...

# Bước 4: Transfer từ local → Render
npx strapi transfer \
  --from http://localhost:1337 \
  --from-token local456def... \
  --to https://your-cms.onrender.com \
  --to-token abc123xyz... \
  --force
```

**Theo dõi quá trình transfer:**
```
⠼ Transferring data...
✔ Content transferred: 50/50 items
✔ Media transferred: 120/120 files
✔ Config transferred: 15/15 items
✨ Transfer completed in 2m 35s
```

### ✅ Bước 5: Verify

```bash
# Kiểm tra CMS trên Render
# 1. Login admin panel
# 2. Kiểm tra Content Manager → Blogs, Categories, Coupons
# 3. Kiểm tra Media Library
# 4. Test API endpoints
```

---

## 2. n8n: Migration SQLite → Supabase PostgreSQL

### 🗄️ Bước 1: Chuẩn bị Supabase PostgreSQL

**1.1. Tạo project trên Supabase:**
1. Vào https://supabase.com → New Project
2. Name: `n8n-workflows`
3. Database Password: tạo mật khẩu mạnh
4. Region: Southeast Asia (Singapore)

**1.2. Lấy connection string:**
1. Settings → Database → Connection string → URI
2. Copy: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`

### 📦 Bước 2: Backup dữ liệu n8n local

**Nếu đang dùng Docker (có script sẵn):**
```bash
# Backup cả database và data volume
./deploy/scripts/backup-n8n.sh ~/backups/n8n

# Output:
# ~/backups/n8n/n8n_db_YYYYMMDD_HHMMSS.sql.gz
# ~/backups/n8n/n8n_data_YYYYMMDD_HHMMSS.tar.gz
```

**Nếu n8n đang dùng SQLite trực tiếp:**
```bash
# Tìm file SQLite của n8n
find ~/.n8n -name "*.db"
# Hoặc: ~/Library/Application Support/n8n/database.sqlite (macOS)

# Copy backup
cp ~/.n8n/database.sqlite ~/backups/n8n_sqlite_$(date +%Y%m%d).db
```

### ⚙️ Bước 3: Deploy n8n lên Render với Supabase

**3.1. Tạo Web Service trên Render:**
1. New → Web Service
2. Docker image: `n8nio/n8n:latest`
3. Name: `n8n-automation`
4. Instance Type: Starter trở lên (Free không đủ RAM cho n8n)

**3.2. Thêm biến môi trường:**

```bash
# n8n Basic Config
N8N_HOST=your-n8n.onrender.com
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://your-n8n.onrender.com/

# Database - Supabase PostgreSQL
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=db.xxx.supabase.co
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=postgres
DB_POSTGRESDB_PASSWORD=your_supabase_password
DB_POSTGRESDB_SSL_ENABLED=true
DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false

# Security - Encryption Key (QUAN TRỌNG!)
N8N_ENCRYPTION_KEY=your_encryption_key_32_chars

# Execution Management
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168
EXECUTIONS_MODE=queue

# Timezone
GENERIC_TIMEZONE=Asia/Ho_Chi_Minh
TZ=Asia/Ho_Chi_Minh
```

**⚠️ QUAN TRỌNG về N8N_ENCRYPTION_KEY:**
- Key này mã hóa credentials (API keys, passwords) trong workflows
- **PHẢI DÙNG KEY CŨ** từ local nếu muốn import workflows có credentials
- Nếu dùng key mới, credentials sẽ không decrypt được!

**Cách lấy encryption key cũ:**
```bash
# Docker
docker exec n8n env | grep N8N_ENCRYPTION_KEY

# Hoặc check trong docker-compose.yml hoặc .env
cat deploy/env/n8n.env.example | grep N8N_ENCRYPTION_KEY

# Hoặc check file config n8n
cat ~/.n8n/config
```

**3.3. Deploy và verify:**
- Deploy n8n trên Render
- n8n sẽ tự động tạo tables trong Supabase
- Truy cập `https://your-n8n.onrender.com`
- Tạo owner account

### 📥 Bước 4: Import workflows vào Supabase

**Phương án A: Import từ PostgreSQL dump**

Nếu bạn đã có backup PostgreSQL từ local:

```bash
# 1. Giải nén backup
gunzip ~/backups/n8n/n8n_db_YYYYMMDD_HHMMSS.sql.gz

# 2. Connect vào Supabase và import
psql "postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres" \
  < ~/backups/n8n/n8n_db_YYYYMMDD_HHMMSS.sql
```

**Phương án B: Export/Import qua n8n UI (Đơn giản nhất)** ✅

```bash
# 1. Export workflows từ n8n local
# Vào n8n local: http://localhost:5678
# Workflows → Select All → Export

# 2. Import vào n8n trên Render
# Vào: https://your-n8n.onrender.com
# Workflows → Import from File → Chọn file JSON
```

**Phương án C: Sử dụng n8n CLI (Nếu có nhiều workflows)**

```bash
# Install n8n CLI
npm install -g n8n

# Export từ SQLite local
n8n export:workflow --all --output=~/backups/n8n-workflows.json

# Import vào Render (cần API key)
# Tạo API key trên n8n Render: Settings → API → Generate
curl -X POST https://your-n8n.onrender.com/api/v1/workflows \
  -H "X-N8N-API-KEY: your_api_key" \
  -H "Content-Type: application/json" \
  -d @~/backups/n8n-workflows.json
```

### ✅ Bước 5: Verify và test

```bash
# 1. Kiểm tra workflows đã import
# 2. Test chạy 1 workflow đơn giản
# 3. Kiểm tra credentials (nếu có lỗi, check N8N_ENCRYPTION_KEY)
# 4. Test webhooks
# 5. Kiểm tra execution history
```

---

## 3. Biến môi trường cho Render

### 🔐 Generate Security Keys

Chạy script này để tạo tất cả keys cần thiết:

```bash
#!/bin/bash
echo "=== CMS Security Keys ==="
echo "APP_KEYS=$(node -e "console.log([...Array(4)].map(() => require('crypto').randomBytes(16).toString('base64')).join(','))")"
echo "API_TOKEN_SALT=$(node -e "console.log(require('crypto').randomBytes(16).toString('base64'))")"
echo "ADMIN_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(16).toString('base64'))")"
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(16).toString('base64'))")"
echo "TRANSFER_TOKEN_SALT=$(node -e "console.log(require('crypto').randomBytes(16).toString('base64'))")"
echo ""
echo "=== n8n Encryption Key ==="
echo "N8N_ENCRYPTION_KEY=$(openssl rand -base64 32)"
```

### 📝 CMS Environment Variables (Render)

```bash
NODE_ENV=production
HOST=0.0.0.0
PORT=10000

# Database
DATABASE_CLIENT=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Security (generate mới)
APP_KEYS=xxx,yyy,zzz,aaa
API_TOKEN_SALT=xxxxx
ADMIN_JWT_SECRET=xxxxx
JWT_SECRET=xxxxx
TRANSFER_TOKEN_SALT=xxxxx

# Optional: Backend API sync (nếu cần)
BACKEND_API_URL=https://your-backend.onrender.com
BACKEND_API_KEY=your_backend_api_key
```

### 📝 n8n Environment Variables (Render)

```bash
# Basic
N8N_HOST=your-n8n.onrender.com
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://your-n8n.onrender.com/

# Database - Supabase
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=db.xxx.supabase.co
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=postgres
DB_POSTGRESDB_PASSWORD=your_password
DB_POSTGRESDB_SSL_ENABLED=true
DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false

# Security (DÙNG KEY CŨ nếu import workflows)
N8N_ENCRYPTION_KEY=your_old_or_new_key_32_chars

# Execution
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168
EXECUTIONS_MODE=queue

# Timezone
GENERIC_TIMEZONE=Asia/Ho_Chi_Minh
TZ=Asia/Ho_Chi_Minh

# Optional: Authentication
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_secure_password
```

---

## 4. Troubleshooting

### ❌ CMS: "Invalid APP_KEYS"

```bash
# Đảm bảo có 4 keys cách nhau bởi dấu phẩy
APP_KEYS=key1,key2,key3,key4
# KHÔNG có khoảng trắng!
```

### ❌ CMS: Transfer token không hoạt động

```bash
# 1. Kiểm tra token còn hiệu lực
# 2. Kiểm tra CMS đã khởi động hoàn toàn
# 3. Thử lại với --verbose flag
npx strapi transfer --from http://localhost:1337 --from-token xxx --to https://render-cms.com --to-token yyy --verbose
```

### ❌ n8n: "Failed to decrypt credentials"

```bash
# Nguyên nhân: N8N_ENCRYPTION_KEY khác với key cũ
# Giải pháp: Dùng lại encryption key từ local
# Check key cũ:
docker exec n8n env | grep N8N_ENCRYPTION_KEY
```

### ❌ n8n: Connection timeout với Supabase

```bash
# Kiểm tra SSL settings
DB_POSTGRESDB_SSL_ENABLED=true
DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false

# Hoặc thử connection string format
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require
```

### ❌ Render: "Out of Memory"

```bash
# n8n cần ít nhất 512MB RAM
# Upgrade instance type từ Free → Starter ($7/month)
```

---

## 📚 Tài liệu tham khảo

- [Strapi Data Transfer](https://docs.strapi.io/dev-docs/data-management/transfer)
- [n8n Database Configuration](https://docs.n8n.io/hosting/configuration/configuration-methods/#database)
- [Render PostgreSQL](https://render.com/docs/databases)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres)

---

## ✅ Checklist cuối cùng

### CMS Migration
- [ ] Export dữ liệu từ SQLite local
- [ ] Tạo PostgreSQL database trên Render
- [ ] Deploy CMS với biến môi trường đúng
- [ ] Import/Transfer dữ liệu
- [ ] Verify content, media, settings
- [ ] Test API endpoints

### n8n Migration
- [ ] Backup workflows và credentials local
- [ ] Tạo Supabase PostgreSQL
- [ ] Lấy encryption key cũ (nếu có)
- [ ] Deploy n8n lên Render với Supabase
- [ ] Import workflows
- [ ] Test workflows và webhooks
- [ ] Setup backup định kỳ

---

**Hoàn thành! 🎉**

Nếu gặp vấn đề, check phần Troubleshooting hoặc hỏi lại.
