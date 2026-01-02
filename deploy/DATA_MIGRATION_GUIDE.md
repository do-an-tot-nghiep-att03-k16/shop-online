# Hướng Dẫn Migration Dữ Liệu Lên Kamatera Server

## Tổng Quan
Hướng dẫn này giúp bạn chuyển dữ liệu từ môi trường local (SQLite) lên Kamatera server (PostgreSQL).

---

## 1. Migration Strapi CMS (SQLite → PostgreSQL)

### Phương Án 1: Strapi Data Transfer (Khuyên Dùng ⭐)

Strapi có tính năng `transfer` cho phép chuyển dữ liệu trực tiếp giữa 2 instance.

#### Bước 1: Tạo Transfer Token trên Server
```bash
# SSH vào Kamatera server
ssh root@your-kamatera-ip

# Vào thư mục deploy
cd /root/deploy

# Tạo transfer token trên CMS production
docker exec -it cms npx strapi transfer:token:create --name migration-token
```

**Lưu lại token này!** Ví dụ: `abc123xyz456...`

#### Bước 2: Transfer từ Local lên Server
```bash
# Trên máy local, vào thư mục CMS
cd my-cms

# Chạy lệnh transfer
npx strapi transfer \
  --to https://cms.yourdomain.com/admin \
  --to-token abc123xyz456...
```

**Lưu ý:**
- Thay `https://cms.yourdomain.com` bằng URL thực tế của CMS trên Kamatera
- Thay `abc123xyz456...` bằng token vừa tạo
- Quá trình này sẽ chuyển:
  - Tất cả content (categories, coupons, blogs, settings...)
  - Media files (images, attachments...)
  - Content types và configurations

#### Options Nâng Cao
```bash
# Transfer chỉ data, không transfer files
npx strapi transfer \
  --to https://cms.yourdomain.com/admin \
  --to-token abc123xyz456... \
  --exclude files

# Transfer với options cụ thể
npx strapi transfer \
  --to https://cms.yourdomain.com/admin \
  --to-token abc123xyz456... \
  --only content,files
```

---

### Phương Án 2: Export/Import File (Backup Method)

Nếu không thể dùng transfer trực tiếp:

#### Bước 1: Export từ Local
```bash
cd my-cms

# Export tất cả data ra file
npx strapi export \
  --file backup-$(date +%Y%m%d).tar.gz \
  --compress
```

#### Bước 2: Upload file lên Server
```bash
# Upload file backup lên server
scp backup-20260102.tar.gz root@your-kamatera-ip:/root/deploy/backup/
```

#### Bước 3: Import trên Server
```bash
# SSH vào server
ssh root@your-kamatera-ip

# Import vào CMS container
docker exec -it cms npx strapi import \
  --file /app/backup-20260102.tar.gz
```

---

## 2. Migration N8N Workflows

N8N có tính năng export/import workflows rất đơn giản.

### Phương Án 1: Export/Import qua UI (Đơn Giản Nhất ⭐)

#### Trên Local:
1. Mở N8N local: `http://localhost:5678`
2. Vào **Settings** → **Community Nodes** → **Import/Export**
3. Click **Export All Workflows**
4. Tải file `workflows.json`

#### Trên Server:
1. Mở N8N trên server: `https://n8n.yourdomain.com`
2. Vào **Settings** → **Import/Export**
3. Click **Import from File**
4. Chọn file `workflows.json` vừa tải

### Phương Án 2: Export/Import Database (Advanced)

Nếu bạn muốn chuyển toàn bộ database bao gồm execution history:

#### Bước 1: Backup N8N Database từ Local
```bash
# Nếu local dùng SQLite
cd ~/.n8n
tar -czf n8n-backup-$(date +%Y%m%d).tar.gz database.sqlite

# Nếu local dùng PostgreSQL
docker exec n8n-postgres pg_dump -U n8n n8n > n8n-backup-$(date +%Y%m%d).sql
```

#### Bước 2: Restore trên Server (PostgreSQL)
```bash
# Upload backup lên server
scp n8n-backup-20260102.sql root@your-kamatera-ip:/root/deploy/backup/

# SSH vào server
ssh root@your-kamatera-ip
cd /root/deploy

# Stop N8N container
docker stop n8n

# Drop và recreate database
docker exec -it n8n-postgres psql -U n8n -c "DROP DATABASE IF EXISTS n8n;"
docker exec -it n8n-postgres psql -U n8n -c "CREATE DATABASE n8n;"

# Restore data
docker exec -i n8n-postgres psql -U n8n n8n < backup/n8n-backup-20260102.sql

# Start N8N lại
docker start n8n
```

**⚠️ Lưu Ý Quan Trọng:**
- N8N_ENCRYPTION_KEY phải **giống nhau** giữa local và server
- Nếu khác nhau, credentials sẽ không decrypt được
- Check file `.env` hoặc `deploy/env/n8n.env` để đảm bảo key giống nhau

---

## 3. Migration MongoDB Data (Backend)

### Bước 1: Backup MongoDB từ Local
```bash
# Nếu MongoDB chạy trong Docker
docker exec mongo mongodump --archive=/data/backup.archive --gzip

# Copy ra ngoài host
docker cp mongo:/data/backup.archive ./mongo-backup-$(date +%Y%m%d).archive
```

### Bước 2: Upload và Restore trên Server

#### Nếu Kamatera dùng MongoDB Docker:
```bash
# Upload backup lên server
scp mongo-backup-20260102.archive root@your-kamatera-ip:/root/deploy/backup/

# SSH vào server
ssh root@your-kamatera-ip
cd /root/deploy

# Copy vào container và restore
docker cp backup/mongo-backup-20260102.archive mongo:/data/
docker exec mongo mongorestore --archive=/data/mongo-backup-20260102.archive --gzip
```

#### Nếu Kamatera dùng MongoDB Atlas (Cloud):
```bash
# Restore trực tiếp lên Atlas
mongorestore --uri "mongodb+srv://username:password@cluster.mongodb.net" \
  --archive=mongo-backup-20260102.archive \
  --gzip
```

---

## 4. Checklist Trước Khi Migration

### Strapi CMS
- [ ] Server đã chạy và accessible qua domain
- [ ] PostgreSQL đang hoạt động (`docker ps | grep cms-postgres`)
- [ ] CMS container đã start (`docker ps | grep cms`)
- [ ] Đã tạo transfer token hoặc admin account trên server
- [ ] **Quan trọng:** Backup dữ liệu hiện tại trên server (nếu có)

### N8N
- [ ] N8N server đang chạy và accessible
- [ ] PostgreSQL đang hoạt động (`docker ps | grep n8n-postgres`)
- [ ] N8N_ENCRYPTION_KEY **giống nhau** giữa local và server
- [ ] Đã có admin account trên N8N server

### MongoDB (Backend)
- [ ] MongoDB/MongoDB Atlas đang hoạt động
- [ ] Backend container có thể connect tới database
- [ ] Đã test connection với credentials

---

## 5. Verification Sau Migration

### Kiểm Tra Strapi CMS
```bash
# Check logs
docker logs cms --tail 50

# Test API
curl https://cms.yourdomain.com/api/categories

# Login vào Admin Panel
# https://cms.yourdomain.com/admin
```

### Kiểm Tra N8N
```bash
# Check logs
docker logs n8n --tail 50

# Login và kiểm tra workflows
# https://n8n.yourdomain.com
```

### Kiểm Tra Backend
```bash
# Check logs
docker logs backend --tail 50

# Test API
curl https://api.yourdomain.com/health
```

---

## 6. Troubleshooting

### Lỗi: "Connection refused" khi transfer Strapi
- Check CMS container đang chạy: `docker ps | grep cms`
- Check domain đã trỏ đúng IP
- Check firewall/security group cho phép port 80/443
- Test bằng curl: `curl -I https://cms.yourdomain.com`

### Lỗi: N8N workflows không chạy được
- Check N8N_ENCRYPTION_KEY có giống nhau không
- Re-import workflows nếu cần
- Reconfigure credentials cho các nodes

### Lỗi: MongoDB connection timeout
- Check MongoDB đang chạy: `docker ps | grep mongo`
- Check connection string trong backend.env
- Check network giữa backend và mongo: `docker network inspect deploy_default`

### CMS admin panel không load được
- Clear browser cache
- Check CORS settings trong cms.env
- Check logs: `docker logs cms -f`

---

## 7. Script Tự Động (Optional)

Tạo script để tự động hóa quá trình:

### Script: `migration-cms.sh`
```bash
#!/bin/bash

echo "🚀 Starting CMS Migration..."

# Variables
SERVER_IP="your-kamatera-ip"
CMS_URL="https://cms.yourdomain.com"
TOKEN="your-transfer-token"

# Export from local
echo "📦 Exporting from local..."
cd my-cms
npx strapi export --file ../backup-cms.tar.gz --compress

# Option 1: Use transfer (recommended)
echo "🔄 Transferring to server..."
npx strapi transfer \
  --to $CMS_URL/admin \
  --to-token $TOKEN

# Option 2: Or upload and import
# echo "📤 Uploading to server..."
# scp ../backup-cms.tar.gz root@$SERVER_IP:/root/deploy/backup/
# 
# echo "📥 Importing on server..."
# ssh root@$SERVER_IP "docker exec -it cms npx strapi import --file /app/backup-cms.tar.gz"

echo "✅ Migration completed!"
```

---

## 8. Best Practices

1. **Luôn backup trước khi migration**
   ```bash
   # Backup trên server trước
   ssh root@kamatera-ip
   docker exec cms npx strapi export --file /app/backup-before-migration.tar.gz
   ```

2. **Test trên staging environment trước (nếu có)**

3. **Maintenance mode trong quá trình migration**
   - Tạm thời stop backend để không có write operations
   - Thông báo cho users về downtime

4. **Verify data integrity sau migration**
   - Check số lượng records
   - Test chức năng quan trọng
   - Check images/files đã upload đủ chưa

5. **Keep backups**
   - Lưu backup local
   - Lưu backup trên server
   - Keep backups ít nhất 7 ngày

---

## 9. Quick Commands Reference

```bash
# Strapi Transfer
npx strapi transfer --to URL --to-token TOKEN

# Strapi Export/Import
npx strapi export --file backup.tar.gz --compress
npx strapi import --file backup.tar.gz

# MongoDB Backup/Restore
mongodump --archive=backup.archive --gzip
mongorestore --archive=backup.archive --gzip

# N8N - Export qua UI hoặc copy workflows JSON

# Check container status
docker ps
docker logs container_name --tail 50

# Access container shell
docker exec -it container_name sh
```

---

## Cần Trợ Giúp?

Nếu gặp vấn đề:
1. Check logs: `docker logs container_name`
2. Verify network: `docker network inspect deploy_default`
3. Check environment variables: `docker exec container_name env | grep DATABASE`
4. Xem thêm: `deploy/TROUBLESHOOTING.md`
