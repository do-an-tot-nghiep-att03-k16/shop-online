# 🤖 Hướng dẫn Migration n8n từ Docker Volume (SQLite) sang Supabase PostgreSQL

## 📋 Tình huống của bạn

**n8n hiện tại:**
```bash
docker run -it --rm -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n
```

- ✅ Chạy n8n qua Docker
- ✅ Dữ liệu lưu trong Docker volume: `n8n_data`
- ✅ Database: SQLite (mặc định trong `/home/node/.n8n/database.sqlite`)
- ✅ Workflows, credentials, executions đều trong volume này

**Mục tiêu:**
- 🎯 Deploy n8n lên Render
- 🎯 Sử dụng Supabase PostgreSQL (không mất dữ liệu khi restart)
- 🎯 Giữ nguyên tất cả workflows và credentials

---

## 🔍 Bước 0: Kiểm tra dữ liệu hiện tại

### Xem nội dung trong Docker volume

```bash
# Kiểm tra volume có tồn tại không
docker volume ls | grep n8n

# Xem nội dung volume
docker run --rm -v n8n_data:/data alpine ls -la /data

# Xem chi tiết các file
docker run --rm -v n8n_data:/data alpine find /data -type f
```

### Tìm encryption key hiện tại (QUAN TRỌNG!)

```bash
# Cách 1: Check trong config file
docker run --rm -v n8n_data:/data alpine cat /data/config

# Cách 2: Chạy n8n và check env
docker run -v n8n_data:/home/node/.n8n n8nio/n8n n8n --version

# Cách 3: Check trong .env nếu có
docker run --rm -v n8n_data:/data alpine cat /data/.env 2>/dev/null || echo "No .env file"
```

**⚠️ QUAN TRỌNG:** 
- Nếu không tìm thấy encryption key, n8n sẽ auto-generate
- Key này đã mã hóa credentials trong database
- PHẢI dùng key này khi migrate sang PostgreSQL!

---

## 📦 Bước 1: Backup toàn bộ dữ liệu n8n

### Option A: Backup cả volume (An toàn nhất)

```bash
# Tạo thư mục backup
mkdir -p ~/backups/n8n-migration

# Backup toàn bộ volume thành tar.gz
docker run --rm \
  -v n8n_data:/data \
  -v ~/backups/n8n-migration:/backup \
  alpine tar czf /backup/n8n_volume_backup_$(date +%Y%m%d).tar.gz -C /data .

# Verify backup
ls -lh ~/backups/n8n-migration/
```

### Option B: Export workflows qua UI

```bash
# 1. Chạy n8n local
docker run -it --rm -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n

# 2. Truy cập: http://localhost:5678
# 3. Workflows → Select All → Export
# 4. Lưu file: n8n_workflows_backup.json
```

### Option C: Copy database SQLite trực tiếp

```bash
# Copy database SQLite ra ngoài
docker run --rm \
  -v n8n_data:/data \
  -v ~/backups/n8n-migration:/backup \
  alpine cp /data/database.sqlite /backup/database.sqlite

# Verify
file ~/backups/n8n-migration/database.sqlite
```

---

## 🗄️ Bước 2: Chuẩn bị Supabase PostgreSQL

### 2.1. Tạo Supabase Project

1. Truy cập: https://supabase.com
2. New Project:
   - Name: `n8n-workflows`
   - Password: Tạo password mạnh và LƯU LẠI
   - Region: **Southeast Asia (Singapore)**

### 2.2. Lấy Connection String

1. Settings → Database → Connection string → **URI**
2. Copy và replace `[YOUR-PASSWORD]`:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

### 2.3. (Optional) Test connection

```bash
# Install psql nếu chưa có
sudo apt-get install postgresql-client

# Test connection
psql "postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres" -c "\l"
```

---

## 🔐 Bước 3: Tìm hoặc tạo Encryption Key

### Tìm key cũ (nếu có)

```bash
# Method 1: Chạy container và check env
docker run -it --rm -v n8n_data:/home/node/.n8n n8nio/n8n env | grep ENCRYPTION

# Method 2: Check config file
docker run --rm -v n8n_data:/data alpine sh -c 'if [ -f /data/config ]; then cat /data/config | grep -i encryption; else echo "No config file"; fi'

# Method 3: Check trong database (advanced)
docker run --rm -v n8n_data:/data alpine sh -c 'if [ -f /data/database.sqlite ]; then sqlite3 /data/database.sqlite "SELECT * FROM settings WHERE key LIKE \"%encryption%\""; fi'
```

### Nếu KHÔNG tìm thấy key cũ

Có 2 lựa chọn:

**Option A: Tạo key mới (workflows sẽ không có credentials)**
```bash
openssl rand -base64 32
# Output: zNjbEOiPpaaVdgA0qUmoOT6hes2x3cZwuqpq3pkqXRs=
```
➡️ Phải setup lại credentials cho tất cả workflows

**Option B: Extract key từ SQLite database**
```bash
# Chạy script extract (tôi sẽ tạo script này)
./tmp_rovodev_extract_n8n_key.sh ~/backups/n8n-migration/n8n_volume_backup_*.tar.gz
```

---

## 🚀 Bước 4: Test migration LOCAL trước (Quan trọng!)

Trước khi deploy lên Render, test migration local với PostgreSQL:

### 4.1. Tạo docker-compose test

```bash
# Tạo file test
cat > ~/backups/n8n-migration/docker-compose-test.yml << 'EOF'
version: '3.8'

services:
  n8n-postgres-test:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: n8n_test
      POSTGRES_USER: n8n_test
      POSTGRES_PASSWORD: test123
    ports:
      - "5433:5432"
    volumes:
      - n8n_test_postgres:/var/lib/postgresql/data

  n8n-test:
    image: n8nio/n8n:latest
    ports:
      - "5679:5678"
    environment:
      # Database - PostgreSQL
      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: n8n-postgres-test
      DB_POSTGRESDB_PORT: 5432
      DB_POSTGRESDB_DATABASE: n8n_test
      DB_POSTGRESDB_USER: n8n_test
      DB_POSTGRESDB_PASSWORD: test123
      
      # Encryption key CŨ (thay bằng key thật)
      N8N_ENCRYPTION_KEY: YOUR_OLD_ENCRYPTION_KEY_HERE
      
      # Timezone
      GENERIC_TIMEZONE: Asia/Ho_Chi_Minh
      TZ: Asia/Ho_Chi_Minh
    depends_on:
      - n8n-postgres-test
    volumes:
      - n8n_test_data:/home/node/.n8n

volumes:
  n8n_test_postgres:
  n8n_test_data:
EOF
```

### 4.2. Chạy test n8n với PostgreSQL

```bash
cd ~/backups/n8n-migration

# Start n8n test với PostgreSQL
docker-compose -f docker-compose-test.yml up -d

# Xem logs
docker-compose -f docker-compose-test.yml logs -f n8n-test

# Truy cập: http://localhost:5679
```

### 4.3. Import workflows vào test instance

```bash
# Truy cập: http://localhost:5679
# 1. Tạo owner account
# 2. Workflows → Import from File
# 3. Chọn file n8n_workflows_backup.json
# 4. Kiểm tra credentials có hoạt động không
```

### 4.4. Verify và dọn dẹp

```bash
# Nếu test OK, dọn dẹp
docker-compose -f docker-compose-test.yml down -v

# Nếu test FAIL, check logs và encryption key
```

---

## ☁️ Bước 5: Deploy n8n lên Render với Supabase

### 5.1. Tạo Web Service trên Render

1. **Render Dashboard** → New → **Web Service**
2. **Docker Image**: `n8nio/n8n:latest`
3. Cấu hình:
   - Name: `n8n-automation`
   - Region: Singapore
   - Instance Type: **Starter** ($7/month - Free không đủ RAM)
   - Port: `5678`

### 5.2. Environment Variables

```bash
# ============================================
# n8n Basic Configuration
# ============================================
N8N_HOST=your-n8n.onrender.com
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://your-n8n.onrender.com/

# ============================================
# Database - Supabase PostgreSQL
# ============================================
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=db.xxx.supabase.co
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=postgres
DB_POSTGRESDB_PASSWORD=your_supabase_password
DB_POSTGRESDB_SSL_ENABLED=true
DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false

# ============================================
# Security - ENCRYPTION KEY (QUAN TRỌNG!)
# ============================================
# PHẢI dùng key CŨ từ local nếu có workflows với credentials
N8N_ENCRYPTION_KEY=YOUR_OLD_ENCRYPTION_KEY_HERE

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
# Optional: Basic Authentication
# ============================================
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_secure_password

# ============================================
# Optional: Email notifications
# ============================================
N8N_EMAIL_MODE=smtp
N8N_SMTP_HOST=smtp.gmail.com
N8N_SMTP_PORT=587
N8N_SMTP_USER=your_email@gmail.com
N8N_SMTP_PASS=your_app_password
N8N_SMTP_SENDER=your_email@gmail.com
```

### 5.3. Deploy và đợi

```bash
# Render sẽ:
# 1. Pull n8n image
# 2. Kết nối Supabase
# 3. n8n tự động tạo tables trong PostgreSQL
# 4. Khởi động n8n

# Xem logs để verify
# Render Dashboard → Your Service → Logs
```

---

## 📥 Bước 6: Import workflows vào Render n8n

### Method 1: Import qua UI (Đơn giản nhất)

```bash
# 1. Truy cập: https://your-n8n.onrender.com
# 2. Tạo owner account (lần đầu)
# 3. Workflows → Import from File
# 4. Chọn n8n_workflows_backup.json
# 5. Activate workflows cần thiết
```

### Method 2: Import qua API

```bash
# 1. Tạo API Key trên Render n8n
# Settings → API → Generate API Key

# 2. Import workflows
curl -X POST https://your-n8n.onrender.com/api/v1/workflows/import \
  -H "X-N8N-API-KEY: your_api_key" \
  -H "Content-Type: application/json" \
  -F "file=@n8n_workflows_backup.json"
```

### Method 3: Migrate database trực tiếp (Advanced)

```bash
# 1. Export SQLite thành SQL
docker run --rm -v n8n_data:/data alpine sh -c \
  "apk add sqlite && sqlite3 /data/database.sqlite .dump > /data/export.sql"

# 2. Convert SQLite SQL sang PostgreSQL format (cần tool pgloader)
# 3. Import vào Supabase
```

---

## ✅ Bước 7: Verify và test

### Checklist verification:

- [ ] Truy cập n8n UI thành công
- [ ] Tất cả workflows đã import
- [ ] Credentials hoạt động (nếu dùng encryption key cũ)
- [ ] Test chạy 1 workflow đơn giản
- [ ] Test webhook (nếu có)
- [ ] Execution history hiển thị đúng
- [ ] Kiểm tra data trong Supabase:

```sql
-- Connect vào Supabase và chạy:
SELECT COUNT(*) FROM workflow_entity;
SELECT COUNT(*) FROM credentials_entity;
SELECT COUNT(*) FROM execution_entity;
```

---

## 🔄 Bước 8: Backup tự động trên Render

### Setup backup định kỳ từ Supabase

```bash
# Script backup Supabase PostgreSQL
cat > ~/backups/backup-n8n-supabase.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="${HOME}/backups/n8n-supabase"
DATE=$(date +%Y%m%d_%H%M%S)
SUPABASE_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"

mkdir -p "$BACKUP_DIR"

# Backup workflows và credentials (không backup executions để giảm dung lượng)
pg_dump "$SUPABASE_URL" \
  --table=workflow_entity \
  --table=credentials_entity \
  --table=settings \
  --table=tag_entity \
  | gzip > "$BACKUP_DIR/n8n_backup_${DATE}.sql.gz"

# Cleanup old backups (giữ 30 ngày)
find "$BACKUP_DIR" -name "n8n_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: n8n_backup_${DATE}.sql.gz"
EOF

chmod +x ~/backups/backup-n8n-supabase.sh
```

### Schedule với cron

```bash
# Thêm vào crontab
crontab -e

# Backup lúc 3 AM hàng ngày
0 3 * * * ~/backups/backup-n8n-supabase.sh >> ~/backups/n8n-backup.log 2>&1
```

---

## 🆘 Troubleshooting

### ❌ "Failed to decrypt credentials"

**Nguyên nhân:** Encryption key sai

**Giải pháp:**
```bash
# 1. Double check encryption key cũ
# 2. Nếu không tìm được, phải setup lại credentials
# 3. Hoặc tạo workflows mới không có credentials
```

### ❌ "Connection timeout to Supabase"

**Nguyên nhân:** SSL configuration

**Giải pháp:**
```bash
# Thêm vào env vars:
DB_POSTGRESDB_SSL_ENABLED=true
DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false

# Hoặc dùng connection string:
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require
```

### ❌ "Table already exists"

**Nguyên nhân:** n8n đã tạo tables trước đó

**Giải pháp:**
```bash
# Option 1: Drop tất cả tables và import lại
psql "$SUPABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Option 2: Dùng import thay vì migrate
# Import workflows qua UI thay vì restore database
```

### ❌ "Webhooks not working"

**Nguyên nhân:** WEBHOOK_URL chưa đúng

**Giải pháp:**
```bash
# Đảm bảo:
WEBHOOK_URL=https://your-n8n.onrender.com/
# (có trailing slash)

# Test webhook:
curl https://your-n8n.onrender.com/webhook-test/xxxxx
```

---

## 📊 So sánh: SQLite vs PostgreSQL

| Feature | SQLite (Local) | PostgreSQL (Supabase) |
|---------|----------------|----------------------|
| Persistence | ❌ Mất khi volume mất | ✅ Luôn lưu trữ cloud |
| Performance | ⚡ Nhanh (single thread) | ⚡⚡ Rất nhanh (concurrent) |
| Concurrent | ❌ Limited | ✅ Excellent |
| Backup | 🔧 Phức tạp | ✅ Tự động |
| Scaling | ❌ Không scale | ✅ Scale dễ dàng |
| Cost | ✅ Free | 💰 Free tier tốt |

---

## 📚 Quick Commands Reference

```bash
# Backup volume cũ
docker run --rm -v n8n_data:/data -v ~/backups:/backup alpine tar czf /backup/n8n_backup.tar.gz -C /data .

# Restore volume (nếu cần)
docker run --rm -v n8n_data:/data -v ~/backups:/backup alpine tar xzf /backup/n8n_backup.tar.gz -C /data

# Check Supabase connection
psql "postgresql://postgres:[PASS]@db.xxx.supabase.co:5432/postgres" -c "\dt"

# Generate encryption key
openssl rand -base64 32

# Test n8n local với PostgreSQL
docker run -it --rm -p 5678:5678 \
  -e DB_TYPE=postgresdb \
  -e DB_POSTGRESDB_HOST=db.xxx.supabase.co \
  -e DB_POSTGRESDB_DATABASE=postgres \
  -e DB_POSTGRESDB_USER=postgres \
  -e DB_POSTGRESDB_PASSWORD=your_pass \
  -e N8N_ENCRYPTION_KEY=your_key \
  n8nio/n8n
```

---

## ✅ Checklist hoàn thành

### Trước khi migrate:
- [ ] Backup n8n volume
- [ ] Export workflows qua UI
- [ ] Tìm encryption key cũ
- [ ] Tạo Supabase project
- [ ] Test connection Supabase

### Trong quá trình migrate:
- [ ] Test migration local trước
- [ ] Deploy n8n lên Render
- [ ] Cấu hình env vars đúng
- [ ] Import workflows
- [ ] Verify credentials

### Sau khi migrate:
- [ ] Test tất cả workflows
- [ ] Setup backup tự động
- [ ] Xóa volume cũ (sau khi chắc chắn)
- [ ] Document encryption key
- [ ] Monitor logs và performance

---

**🎉 Hoàn thành migration! Workflows của bạn đã an toàn trên cloud với PostgreSQL.**

Nếu gặp vấn đề, check phần Troubleshooting hoặc hỏi lại!
