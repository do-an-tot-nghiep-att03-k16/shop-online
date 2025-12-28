# n8n Backup & Restore Scripts

Scripts để backup và restore dữ liệu n8n (workflows, credentials, executions).

## 📦 Nội dung backup

**1. PostgreSQL Database:**
- Workflows (tất cả automation flows)
- Credentials (API keys, tokens - encrypted)
- Execution history (lịch sử chạy workflows)
- Settings & configurations
- User accounts & permissions

**2. n8n Data Volume:**
- Custom nodes (nếu có)
- Encryption keys
- Binary files
- Local cache

## 🚀 Sử dụng

### 1. Backup thủ công

```bash
# Make script executable (lần đầu)
chmod +x deploy/scripts/backup-n8n.sh

# Chạy backup
./deploy/scripts/backup-n8n.sh

# Hoặc chỉ định thư mục backup
./deploy/scripts/backup-n8n.sh /path/to/backups
```

**Output:**
- `n8n_db_YYYYMMDD_HHMMSS.sql.gz` - PostgreSQL dump
- `n8n_data_YYYYMMDD_HHMMSS.tar.gz` - Volume data

### 2. Setup backup tự động (cron)

```bash
# Chạy script setup (cần sudo cho log directory)
sudo ./deploy/scripts/setup-n8n-backup-cron.sh
```

Script sẽ:
- Tạo cron job chạy lúc 2h sáng hàng ngày
- Tạo thư mục backup: `~/backups/n8n`
- Tạo log file: `/var/log/n8n-backup/backup.log`
- Tự động xóa backups cũ hơn 7 ngày

**Kiểm tra cron:**
```bash
# Xem cron jobs
crontab -l | grep n8n

# Test backup ngay
./deploy/scripts/backup-n8n.sh ~/backups/n8n

# Xem logs
tail -f /var/log/n8n-backup/backup.log
```

### 3. Restore từ backup

```bash
# Make script executable (lần đầu)
chmod +x deploy/scripts/restore-n8n.sh

# Restore từ backup cụ thể
./deploy/scripts/restore-n8n.sh \
  ~/backups/n8n/n8n_db_20250101_020000.sql.gz \
  ~/backups/n8n/n8n_data_20250101_020000.tar.gz
```

**⚠️ Lưu ý:** Script sẽ:
1. Hỏi xác nhận (ghi đè dữ liệu hiện tại)
2. Dừng n8n container
3. Restore database + volume
4. Khởi động lại n8n

## 📋 Thay đổi cấu hình

### Thay đổi lịch backup

Edit cron job:
```bash
crontab -e

# Thay đổi từ "0 2 * * *" (2 AM) sang lịch khác:
# 0 */6 * * * - Mỗi 6 giờ
# 0 0 * * * - Nửa đêm hàng ngày
# 0 2 * * 0 - 2 AM mỗi Chủ Nhật
```

### Thay đổi thời gian giữ backup

Edit `backup-n8n.sh`:
```bash
RETENTION_DAYS=7  # Đổi thành số ngày muốn giữ
```

### Thay đổi tên container/volume

Nếu bạn dùng tên khác trong docker-compose, edit trong `backup-n8n.sh` và `restore-n8n.sh`:
```bash
POSTGRES_CONTAINER="n8n-postgres"  # Tên container
N8N_VOLUME="n8n_data"              # Tên volume
```

## 🔍 Kiểm tra backups

```bash
# Liệt kê backups
ls -lh ~/backups/n8n/

# Kiểm tra kích thước backup
du -sh ~/backups/n8n/

# Xem nội dung database backup (không restore)
gunzip -c ~/backups/n8n/n8n_db_*.sql.gz | less

# Xem nội dung volume backup
tar tzf ~/backups/n8n/n8n_data_*.tar.gz | less
```

## 🆘 Khắc phục sự cố

### Backup thất bại

**Lỗi: "Cannot connect to PostgreSQL"**
```bash
# Kiểm tra container đang chạy
docker ps | grep n8n-postgres

# Xem logs
docker logs n8n-postgres
```

**Lỗi: "Volume not found"**
```bash
# Kiểm tra volumes
docker volume ls | grep n8n

# Inspect volume
docker volume inspect n8n_data
```

### Restore thất bại

**Lỗi: "Database already exists"**
```bash
# Drop database trước khi restore (cẩn thận!)
docker exec -it n8n-postgres psql -U n8n -c "DROP DATABASE n8n;"
docker exec -it n8n-postgres psql -U n8n -c "CREATE DATABASE n8n;"

# Restore lại
./deploy/scripts/restore-n8n.sh <db_backup> <data_backup>
```

## 🔐 Bảo mật backups

### Mã hóa backups (khuyến nghị cho production)

```bash
# Backup và mã hóa
./deploy/scripts/backup-n8n.sh
cd ~/backups/n8n
gpg -c n8n_db_*.sql.gz    # Nhập passphrase
gpg -c n8n_data_*.tar.gz

# Giải mã khi cần restore
gpg -d n8n_db_*.sql.gz.gpg > n8n_db_*.sql.gz
```

### Upload lên cloud storage

```bash
# AWS S3
aws s3 sync ~/backups/n8n/ s3://your-bucket/n8n-backups/

# Rsync tới remote server
rsync -avz ~/backups/n8n/ user@backup-server:/backups/n8n/
```

## 📊 Monitoring

```bash
# Check backup size trend
du -h ~/backups/n8n/* | sort -h

# Check latest backup
ls -lt ~/backups/n8n/ | head -5

# Verify backup integrity
gunzip -t ~/backups/n8n/n8n_db_*.sql.gz && echo "Database backup OK"
tar tzf ~/backups/n8n/n8n_data_*.tar.gz > /dev/null && echo "Volume backup OK"
```

## 🔄 Migration giữa servers

```bash
# Server cũ: backup
./deploy/scripts/backup-n8n.sh /tmp/n8n-migration

# Copy sang server mới
scp /tmp/n8n-migration/n8n_*.gz user@new-server:/tmp/

# Server mới: restore
./deploy/scripts/restore-n8n.sh \
  /tmp/n8n_db_*.sql.gz \
  /tmp/n8n_data_*.tar.gz
```

## ✅ Checklist Production

- [ ] Setup cron backup tự động
- [ ] Test restore thử nghiệm
- [ ] Monitor backup logs định kỳ
- [ ] Mã hóa backups nhạy cảm
- [ ] Upload backups lên cloud/remote
- [ ] Document restore procedure
- [ ] Test disaster recovery plan

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Check logs: `tail -f /var/log/n8n-backup/backup.log`
2. Check container status: `docker ps -a | grep n8n`
3. Check volumes: `docker volume ls | grep n8n`
