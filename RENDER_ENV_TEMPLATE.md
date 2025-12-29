# 🔐 Render Environment Variables Template

## CMS (Strapi) Environment Variables

Copy các biến này vào **Render Dashboard → Your CMS Service → Environment**:

```bash
# ============================================
# Basic Configuration
# ============================================
NODE_ENV=production
HOST=0.0.0.0
PORT=10000

# ============================================
# Database - PostgreSQL from Render
# ============================================
DATABASE_CLIENT=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_SSL=true

# ============================================
# Security Keys - PHẢI GENERATE MỚI
# Chạy: ./tmp_rovodev_generate_keys.sh
# ============================================
APP_KEYS=<paste_4_keys_separated_by_comma>
API_TOKEN_SALT=<paste_api_token_salt>
ADMIN_JWT_SECRET=<paste_admin_jwt_secret>
JWT_SECRET=<paste_jwt_secret>
TRANSFER_TOKEN_SALT=<paste_transfer_token_salt>
```

---

## n8n Environment Variables (với Supabase)

Copy các biến này vào **Render Dashboard → Your n8n Service → Environment**:

```bash
# ============================================
# n8n Basic Configuration
# ============================================
N8N_HOST=your-n8n-name.onrender.com
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://your-n8n-name.onrender.com/

# ============================================
# Database - Supabase PostgreSQL
# ============================================
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=db.xxx.supabase.co
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=postgres
DB_POSTGRESDB_PASSWORD=<your_supabase_password>
DB_POSTGRESDB_SSL_ENABLED=true
DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false

# ============================================
# Security - Encryption Key
# QUAN TRỌNG: Dùng key CŨ nếu có workflows với credentials
# ============================================
N8N_ENCRYPTION_KEY=<your_old_key_or_generate_new>

# ============================================
# Execution Management
# ============================================
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168
EXECUTIONS_MODE=queue
EXECUTIONS_PROCESS=main

# ============================================
# Timezone
# ============================================
GENERIC_TIMEZONE=Asia/Ho_Chi_Minh
TZ=Asia/Ho_Chi_Minh

# ============================================
# Optional: Basic Auth
# ============================================
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=<your_secure_password>
```

---

## 📝 Cách sử dụng

### Bước 1: Generate Security Keys

```bash
# Chạy script generate keys
./tmp_rovodev_generate_keys.sh

# Copy output và paste vào template trên
```

### Bước 2: Thêm vào Render

1. **Render Dashboard** → Your Service
2. **Environment** tab
3. **Add Environment Variable**
4. Paste từng cặp key-value từ template

### Bước 3: Deploy

1. **Manual Deploy** hoặc **Push code** để trigger auto-deploy
2. Xem **Logs** để kiểm tra
3. Truy cập service URL để verify

---

## ⚠️ LƯU Ý QUAN TRỌNG

### CMS (Strapi):

1. **APP_KEYS**: PHẢI có 4 keys, cách nhau bởi dấu phẩy
2. **DATABASE_URL**: Render tự động inject nếu link service với PostgreSQL
3. **DATABASE_SSL**: Phải set `true` cho Render PostgreSQL

### n8n:

1. **N8N_ENCRYPTION_KEY**: 
   - Dùng key CŨ nếu có workflows với credentials
   - Tìm key cũ: `./tmp_rovodev_extract_n8n_key.sh <backup_file>`
   - Generate mới chỉ khi bắt đầu fresh

2. **DB_POSTGRESDB_HOST**: Lấy từ Supabase Settings → Database
3. **N8N_HOST**: Thay bằng URL thực của service trên Render

---

## 🔗 Link Service với Database

### CMS với Render PostgreSQL:

1. Render Dashboard → Your CMS Service
2. **Environment** tab → **Link Service**
3. Chọn PostgreSQL database đã tạo
4. Render sẽ tự động inject `${{Postgres.DATABASE_URL}}`

### n8n với Supabase:

- KHÔNG link qua Render
- Điền thủ công connection details từ Supabase
- Đảm bảo Supabase cho phép connection từ external IPs

---

## 🧪 Verify Environment Variables

### CMS:
```bash
# Sau khi deploy, check logs:
# Render Dashboard → Logs

# Tìm dòng này để verify:
# [2025-12-29 02:27:44.055] INFO (strapi): Project information
# [2025-12-29 02:27:44.056] INFO (strapi): Database: postgres

# Nếu thấy "Database: sqlite" -> Kiểm tra lại DATABASE_CLIENT
```

### n8n:
```bash
# Check logs:
# Tìm: "Editor is now accessible via:"
# Tìm: "Database: postgresdb"

# Nếu không thấy -> Check DB_TYPE và connection params
```

---

## 🆘 Troubleshooting

### ❌ CMS: "APP_KEYS is required"
```bash
# Đảm bảo:
APP_KEYS=key1,key2,key3,key4
# KHÔNG có khoảng trắng!
# KHÔNG có dấu ngoặc kép!
```

### ❌ CMS: "Cannot connect to database"
```bash
# Check:
1. DATABASE_CLIENT=postgres (không phải postgresql)
2. DATABASE_URL có đúng không
3. DATABASE_SSL=true
```

### ❌ n8n: "Connection timeout"
```bash
# Check:
1. DB_POSTGRESDB_HOST đúng chưa (không có https://)
2. DB_POSTGRESDB_SSL_ENABLED=true
3. DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false
```

---

## ✅ Checklist

### Trước khi deploy:
- [ ] Đã chạy `./tmp_rovodev_generate_keys.sh`
- [ ] Đã có PostgreSQL database (Render hoặc Supabase)
- [ ] Đã có connection details

### Khi config trên Render:
- [ ] Đã add tất cả environment variables
- [ ] Đã verify không có typo
- [ ] Đã link service với database (nếu dùng Render PostgreSQL)

### Sau khi deploy:
- [ ] Check logs không có lỗi
- [ ] Truy cập service URL thành công
- [ ] Test chức năng cơ bản

---

**🎉 Environment variables ready! Deploy thôi!**
