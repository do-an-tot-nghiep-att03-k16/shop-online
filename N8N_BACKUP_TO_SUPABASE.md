# 🚀 Push n8n Data (Workflows + Credentials) lên Supabase

## 📋 Tổng quan

Bạn có n8n local với SQLite trong Docker volume `n8n_data`. Mục tiêu:chỉ cách push dữ liệu credentials với workflow lên supabase
- ✅ Backup workflows
- ✅ Backup credentials (encrypted)
- ✅ Migrate sang Supabase PostgreSQL
- ✅ Deploy n8n lên Render với Supabase

---

## 🔐 QUAN TRỌNG: Encryption Key

**Credentials được mã hóa bằng `N8N_ENCRYPTION_KEY`**

⚠️ **BẮT BUỘC tìm key cũ trước khi migrate!** Nếu không, credentials sẽ không decrypt được.

---

## 📦 Phương pháp 1: Export/Import qua UI (Đơn giản nhất)

### Bước 1: Backup workflows từ n8n local

```bash
# 1. Chạy n8n local
docker run -it --rm -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n

# 2. Truy cập http://localhost:5678
# 3. Login (nếu có password)
# 4. Workflows → Select All (Ctrl+A)
# 5. Actions → Export
# 6. Lưu file: n8n_workflows_backup.json
```

**Lưu ý:** Export qua UI sẽ:
- ✅ Bao gồm tất cả workflows
- ✅ Bao gồm workflow structure
- ❌ **KHÔNG bao gồm credentials** (vì lý do bảo mật)

### Bước 2: Tìm Encryption Key cũ

```bash
# Method 1: Extract từ backup
./tmp_rovodev_extract_n8n_key.sh ~/backups/n8n-migration/n8n_volume_backup_*.tar.gz

# Method 2: Check trong container running
docker run -it --rm -v n8n_data:/data alpine sh -c "find /data -name 'config' -o -name '.env' | xargs cat"

# Method 3: Check environment từ Docker
docker ps | grep n8n
docker exec <container_id> env | grep ENCRYPTION
```

**Nếu KHÔNG tìm thấy key:**
- n8n auto-generated key khi chạy lần đầu
- Key có thể không được lưu vào file
- **Hậu quả:** Phải re-setup tất cả credentials trên Supabase

### Bước 3: Setup Supabase PostgreSQL

```bash
# 1. Tạo Supabase project tại https://supabase.com
#    - Name: n8n-workflows
#    - Region: Southeast Asia (Singapore)
#    - Password: tạo password mạnh

# 2. Lấy connection string
#    Settings → Database → Connection string → URI
#    postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres

# 3. Test connection (optional)
psql "postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres" -c "\l"
```

### Bước 4: Deploy n8n lên Render với Supabase

**Tạo Web Service trên Render:**

1. **New → Web Service**
2. **Docker Image**: `n8nio/n8n:latest`
3. **Name**: `n8n-automation`
4. **Instance Type**: **Starter** ($7/month - Free không đủ RAM)
5. **Environment Variables**:

```bash
# Basic Config
N8N_HOST=your-n8n-name.onrender.com
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://your-n8n-name.onrender.com/

# Database - Supabase PostgreSQL
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=db.xxx.supabase.co
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=postgres
DB_POSTGRESDB_PASSWORD=your_supabase_password
DB_POSTGRESDB_SSL_ENABLED=true
DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false

# ENCRYPTION KEY - Dùng key CŨ từ bước 2
N8N_ENCRYPTION_KEY=your_old_encryption_key_here

# Execution Management
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168
EXECUTIONS_MODE=queue

# Timezone
GENERIC_TIMEZONE=Asia/Ho_Chi_Minh
TZ=Asia/Ho_Chi_Minh

# Optional: Basic Auth
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_secure_password
```

6. **Deploy** và đợi n8n khởi động (2-3 phút)

### Bước 5: Import workflows vào n8n Render

```bash
# 1. Truy cập: https://your-n8n.onrender.com
# 2. Tạo owner account (lần đầu)
# 3. Workflows → Import from File
# 4. Chọn file n8n_workflows_backup.json
# 5. Workflows sẽ được import
```

### Bước 6: Re-configure Credentials

**Nếu dùng encryption key CŨ:**
- ✅ Credentials sẽ tự động hoạt động
- ✅ Không cần setup lại

**Nếu dùng encryption key MỚI:**
- ❌ Credentials sẽ báo lỗi decrypt
- ⚠️ Phải re-configure từng credential manually:
  - Settings → Credentials
  - Edit từng credential
  - Nhập lại API keys, passwords, tokens

---

## 📦 Phương pháp 2: Database Migration (Advanced, bảo toàn 100% data)

### Bước 1: Backup SQLite database

```bash
# Tạo thư mục backup
mkdir -p ~/backups/n8n-supabase-migration

# Copy SQLite database từ Docker volume
docker run --rm \
  -v n8n_data:/data \
  -v ~/backups/n8n-supabase-migration:/backup \
  alpine cp /data/database.sqlite /backup/database.sqlite

# Verify
ls -lh ~/backups/n8n-supabase-migration/database.sqlite
```

### Bước 2: Extract encryption key

```bash
# Tìm key trong database
docker run --rm -v n8n_data:/data alpine sh -c \
  "apk add sqlite && sqlite3 /data/database.sqlite \"SELECT * FROM settings WHERE key LIKE '%encryption%'\""

# Hoặc dùng script
./tmp_rovodev_extract_n8n_key.sh ~/backups/n8n-supabase-migration/n8n_volume_backup.tar.gz
```

### Bước 3: Convert SQLite → PostgreSQL

**Option A: Sử dụng pgloader (Recommended)**

```bash
# 1. Install pgloader (Ubuntu/Debian)
sudo apt-get install pgloader

# 2. Tạo conversion script
cat > ~/backups/n8n-supabase-migration/convert.load << 'EOF'
LOAD DATABASE
  FROM sqlite:///home/your_user/backups/n8n-supabase-migration/database.sqlite
  INTO postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres

WITH include no drop, create tables, create indexes, reset sequences

EXCLUDING TABLE NAMES MATCHING ~<'sqlite_sequence'>

ALTER SCHEMA 'main' RENAME TO 'public'
;
EOF

# 3. Chạy conversion
pgloader ~/backups/n8n-supabase-migration/convert.load

# 4. Verify
psql "postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres" -c "\dt"
```

**Option B: Manual SQL dump**

```bash
# 1. Export SQLite to SQL
docker run --rm -v n8n_data:/data alpine sh -c \
  "apk add sqlite && sqlite3 /data/database.sqlite .dump" > ~/backups/n8n-supabase-migration/n8n_dump.sql

# 2. Clean up SQLite-specific syntax
sed -i 's/PRAGMA.*//g' ~/backups/n8n-supabase-migration/n8n_dump.sql
sed -i 's/BEGIN TRANSACTION/BEGIN/g' ~/backups/n8n-supabase-migration/n8n_dump.sql

# 3. Import to Supabase
psql "postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres" \
  < ~/backups/n8n-supabase-migration/n8n_dump.sql
```

### Bước 4: Deploy n8n với Supabase

Giống như Phương pháp 1, Bước 4

### Bước 5: Verify data

```bash
# Connect vào Supabase và check
psql "postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"

# Check tables
\dt

# Check workflows
SELECT id, name, active FROM workflow_entity;

# Check credentials
SELECT id, name, type FROM credentials_entity;

# Check executions
SELECT COUNT(*) FROM execution_entity;
```

---

## 📦 Phương pháp 3: API-based Migration (Automation)

### Bước 1: Tạo migration script

```javascript
// migrate-n8n-to-supabase.js
const axios = require('axios');
const { Client } = require('pg');

// n8n local config
const N8N_LOCAL_URL = 'http://localhost:5678';
const N8N_LOCAL_API_KEY = 'your_local_api_key';

// n8n Render config
const N8N_RENDER_URL = 'https://your-n8n.onrender.com';
const N8N_RENDER_API_KEY = 'your_render_api_key';

async function migrateWorkflows() {
  console.log('📦 Exporting workflows from local n8n...');
  
  // Export workflows from local
  const localWorkflows = await axios.get(
    `${N8N_LOCAL_URL}/api/v1/workflows`,
    {
      headers: { 'X-N8N-API-KEY': N8N_LOCAL_API_KEY }
    }
  );

  console.log(`Found ${localWorkflows.data.data.length} workflows`);

  // Import to Render n8n
  for (const workflow of localWorkflows.data.data) {
    console.log(`Importing: ${workflow.name}`);
    
    await axios.post(
      `${N8N_RENDER_URL}/api/v1/workflows`,
      workflow,
      {
        headers: { 'X-N8N-API-KEY': N8N_RENDER_API_KEY }
      }
    );
  }

  console.log('✅ Workflows migration complete!');
}

// Run migration
migrateWorkflows().catch(console.error);
```

### Bước 2: Generate API keys

**Local n8n:**
```bash
# 1. Chạy n8n local
docker run -it --rm -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n

# 2. http://localhost:5678
# 3. Settings → API → Generate API Key
```

**Render n8n:**
```bash
# 1. Deploy n8n lên Render (Phương pháp 1, Bước 4)
# 2. https://your-n8n.onrender.com
# 3. Settings → API → Generate API Key
```

### Bước 3: Chạy migration

```bash
# Install dependencies
npm install axios pg

# Run script
node migrate-n8n-to-supabase.js
```

---

## 🔍 Verify Migration Success

### Checklist:

- [ ] n8n Render đang chạy và truy cập được
- [ ] Supabase PostgreSQL có connection
- [ ] Workflows hiển thị trong Workflows list
- [ ] Credentials hiển thị (nếu dùng key cũ)
- [ ] Test chạy 1 workflow đơn giản
- [ ] Webhooks hoạt động (test với webhook test URL)
- [ ] Execution history hiển thị

### SQL queries để verify:

```sql
-- Connect to Supabase
psql "postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"

-- Check tables exist
\dt

-- Count workflows
SELECT COUNT(*) as workflow_count FROM workflow_entity;

-- List workflows
SELECT id, name, active, created_at FROM workflow_entity ORDER BY created_at DESC;

-- Count credentials
SELECT COUNT(*) as credential_count FROM credentials_entity;

-- List credentials
SELECT id, name, type FROM credentials_entity;

-- Check recent executions
SELECT id, workflow_id, finished, "startedAt" 
FROM execution_entity 
ORDER BY "startedAt" DESC 
LIMIT 10;
```

---

## 🆘 Troubleshooting

### ❌ "Failed to decrypt credentials"

**Nguyên nhân:** `N8N_ENCRYPTION_KEY` khác với key cũ

**Giải pháp:**
1. Tìm lại encryption key cũ (Phương pháp 2, Bước 2)
2. Update environment variable trên Render
3. Restart service
4. Nếu không tìm được → Re-configure credentials manually

### ❌ "Connection timeout to Supabase"

**Nguyên nhân:** SSL configuration hoặc firewall

**Giải pháp:**
```bash
# Đảm bảo có:
DB_POSTGRESDB_SSL_ENABLED=true
DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false

# Check Supabase IP whitelist
# Supabase → Settings → Database → Connection pooling
```

### ❌ "Table already exists" khi migrate

**Nguyên nhân:** n8n đã tạo tables khi khởi động lần đầu

**Giải pháp:**

**Option A: Import workflows qua UI thay vì restore database**
- Dùng Phương pháp 1 (Export/Import qua UI)

**Option B: Drop và recreate schema**
```sql
-- CẢNH BÁO: Xóa toàn bộ dữ liệu hiện tại!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Sau đó chạy lại migration
```

### ❌ "Workflows imported but not executing"

**Nguyên nhân:** Credentials missing hoặc webhooks chưa update

**Giải pháp:**
1. Check credentials có lỗi không
2. Re-configure credentials nếu cần
3. Update webhook URLs trong workflows
4. Test execution manually

---

## 💡 Best Practices

### 1. Backup trước khi migrate

```bash
# Backup toàn bộ n8n volume
docker run --rm \
  -v n8n_data:/data \
  -v ~/backups:/backup \
  alpine tar czf /backup/n8n_full_backup_$(date +%Y%m%d).tar.gz -C /data .
```

### 2. Test migration local trước

```bash
# Test với PostgreSQL local trước khi lên Supabase
docker run -d --name postgres-test \
  -e POSTGRES_PASSWORD=test123 \
  -p 5432:5432 \
  postgres:15-alpine

# Test n8n với PostgreSQL local
docker run -it --rm -p 5679:5678 \
  -e DB_TYPE=postgresdb \
  -e DB_POSTGRESDB_HOST=host.docker.internal \
  -e DB_POSTGRESDB_PORT=5432 \
  -e DB_POSTGRESDB_DATABASE=postgres \
  -e DB_POSTGRESDB_USER=postgres \
  -e DB_POSTGRESDB_PASSWORD=test123 \
  -e N8N_ENCRYPTION_KEY=test_key_32_chars_long_min \
  n8nio/n8n
```

### 3. Document encryption key

```bash
# Lưu key vào file an toàn
echo "N8N_ENCRYPTION_KEY=your_key_here" > ~/.n8n-encryption-key
chmod 600 ~/.n8n-encryption-key

# Backup key
cp ~/.n8n-encryption-key ~/backups/n8n_encryption_key_$(date +%Y%m%d).txt
```

### 4. Setup continuous backup trên Supabase

```bash
# Script backup Supabase PostgreSQL định kỳ
cat > ~/backups/backup-n8n-supabase.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="${HOME}/backups/n8n-supabase"
DATE=$(date +%Y%m%d_%H%M%S)
SUPABASE_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"

mkdir -p "$BACKUP_DIR"

# Backup workflows và credentials only (không backup executions)
pg_dump "$SUPABASE_URL" \
  --table=workflow_entity \
  --table=credentials_entity \
  --table=settings \
  --table=tag_entity \
  | gzip > "$BACKUP_DIR/n8n_backup_${DATE}.sql.gz"

# Keep last 30 days
find "$BACKUP_DIR" -name "n8n_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: n8n_backup_${DATE}.sql.gz"
EOF

chmod +x ~/backups/backup-n8n-supabase.sh

# Add to crontab (daily at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * * ~/backups/backup-n8n-supabase.sh") | crontab -
```

---

## 📊 So sánh các phương pháp

| Phương pháp | Độ khó | Credentials | Executions | Khuyến nghị |
|-------------|---------|-------------|-----------|-------------|
| **UI Export/Import** | ⭐ Dễ | ❌ Phải re-config | ❌ Không | ✅ Workflows đơn giản |
| **Database Migration** | ⭐⭐⭐ Khó | ✅ Giữ nguyên | ✅ Giữ nguyên | ✅ Production data |
| **API Migration** | ⭐⭐ Trung bình | ❌ Phải re-config | ❌ Không | ⚠️ Automation |

---

## ✅ Recommended Flow

**Cho workflows không nhiều credentials:**
→ **Phương pháp 1** (UI Export/Import)

**Cho production với nhiều credentials:**
→ **Phương pháp 2** (Database Migration với pgloader)

**Cho automation/CI-CD:**
→ **Phương pháp 3** (API-based)

---

## 🎉 Success!

Sau khi hoàn thành, bạn có:
- ✅ n8n chạy trên Render
- ✅ Data lưu an toàn trên Supabase PostgreSQL
- ✅ Workflows và credentials đã migrate
- ✅ Không mất data khi Render restart
- ✅ Backup tự động hàng ngày

**n8n automation của bạn đã cloud-ready! 🚀**
