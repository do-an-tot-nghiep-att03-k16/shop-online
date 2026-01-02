# 🚀 Quick Start Guide - Deploy to Kamatera

Hướng dẫn nhanh để deploy toàn bộ hệ thống lên Kamatera server.

---

## 📋 Prerequisites Checklist

Trước khi bắt đầu, đảm bảo bạn có:

- [x] Kamatera server đã setup (Ubuntu 20.04+)
- [x] Docker & Docker Compose đã cài đặt
- [x] Domain name (ví dụ: yourdomain.com)
- [x] Tài khoản Cloudflare (free plan)
- [x] GitHub account với access token
- [ ] Dữ liệu local đã sẵn sàng để migrate

---

## 🎯 Quy Trình 4 Bước

### **Bước 1: Setup Server** ⚙️
**Status:** ✅ Hoàn thành

Server đã chạy containers:
```bash
ssh root@your-kamatera-ip
docker ps
```

**Tài liệu:** [`KAMATERA_SETUP_GUIDE.md`](./KAMATERA_SETUP_GUIDE.md)

---

### **Bước 2: Cấu Hình Cloudflare & Domain** 🌐
**Status:** ⏳ Cần làm tiếp

#### Quick Steps:

1. **Add domain to Cloudflare**
   - Login: https://dash.cloudflare.com
   - Add Site → Enter domain → Free plan

2. **Update Nameservers**
   - Copy Cloudflare nameservers
   - Update tại domain provider (GoDaddy/Namecheap)
   - Đợi 15-30 phút để propagate

3. **Add DNS Records**
   | Type | Name | Content | Proxy |
   |------|------|---------|-------|
   | A | @ | `kamatera-ip` | ✅ |
   | A | www | `kamatera-ip` | ✅ |
   | A | api | `kamatera-ip` | ✅ |
   | A | cms | `kamatera-ip` | ✅ |
   | A | n8n | `kamatera-ip` | ✅ |

4. **Create SSL Certificate**
   - SSL/TLS → Origin Server → Create Certificate
   - Copy certificate & private key
   - Upload to server at `/etc/ssl/cloudflare/`

5. **Configure Nginx**
   - Update `nginx/conf.d/default.conf` with your domain
   - Reload nginx: `docker exec reverse-proxy nginx -s reload`

6. **Update ENV files**
   - `env/backend.env` → CORS_ORIGINS
   - `env/cms.env` → PUBLIC_URL
   - `env/n8n.env` → N8N_HOST, WEBHOOK_URL
   - Restart containers

**Tài liệu chi tiết:** [`CLOUDFLARE_SETUP_GUIDE.md`](./CLOUDFLARE_SETUP_GUIDE.md)

**Verify:**
```bash
./verify-setup.sh yourdomain.com
```

---

### **Bước 3: Migration Dữ Liệu** 📦
**Status:** ⏰ Chờ Bước 2 hoàn thành

Sau khi domain và SSL đã hoạt động, migrate dữ liệu:

#### 3.1. Strapi CMS (SQLite → PostgreSQL)
```bash
# Trên server, tạo token
ssh root@kamatera-ip
docker exec cms npx strapi transfer:token:create --name migration

# Trên local, transfer data
cd my-cms
npx strapi transfer \
  --to https://cms.yourdomain.com/admin \
  --to-token YOUR_TOKEN
```

#### 3.2. N8N Workflows
- Local: http://localhost:5678 → Settings → Export Workflows
- Server: https://n8n.yourdomain.com → Settings → Import

#### 3.3. MongoDB Data
```bash
# Backup local
docker exec mongo mongodump --archive=/data/backup.archive --gzip
docker cp mongo:/data/backup.archive ./mongo-backup.archive

# Upload & restore
scp mongo-backup.archive root@kamatera-ip:/root/deploy/backup/
ssh root@kamatera-ip
docker cp backup/mongo-backup.archive mongo:/data/
docker exec mongo mongorestore --archive=/data/mongo-backup.archive --gzip
```

**Tài liệu chi tiết:** [`DATA_MIGRATION_GUIDE.md`](./DATA_MIGRATION_GUIDE.md)

**Script tự động:**
```bash
./quick-migration.sh cms    # CMS only
./quick-migration.sh n8n    # N8N only
./quick-migration.sh mongo  # MongoDB only
./quick-migration.sh all    # Everything
```

---

### **Bước 4: Testing & Go Live** 🎉
**Status:** ⏰ Chờ Bước 3 hoàn thành

#### 4.1. Verify All Services
```bash
# Test URLs
curl -I https://yourdomain.com           # Frontend
curl -I https://api.yourdomain.com       # Backend
curl -I https://cms.yourdomain.com       # CMS
curl -I https://n8n.yourdomain.com       # N8N

# Check data
# - Login to CMS admin
# - Check categories, products, blogs
# - Test N8N workflows
# - Test frontend shopping flow
```

#### 4.2. Final Checklist
- [ ] All domains accessible via HTTPS
- [ ] SSL certificates valid
- [ ] CMS data migrated (categories, products, etc.)
- [ ] N8N workflows imported
- [ ] MongoDB data restored
- [ ] Frontend can load products
- [ ] Backend API working
- [ ] Orders can be placed
- [ ] Email notifications working
- [ ] Payment integration working

#### 4.3. Monitor
```bash
# Watch logs
docker logs -f backend
docker logs -f cms
docker logs -f n8n

# Check resource usage
docker stats

# Setup monitoring (optional)
# - Cloudflare Analytics
# - UptimeRobot
# - Sentry for error tracking
```

---

## 📚 Tài Liệu Tham Khảo

### Setup Guides
- [`KAMATERA_SETUP_GUIDE.md`](./KAMATERA_SETUP_GUIDE.md) - Server setup
- [`CLOUDFLARE_SETUP_GUIDE.md`](./CLOUDFLARE_SETUP_GUIDE.md) - Domain & SSL
- [`DATA_MIGRATION_GUIDE.md`](./DATA_MIGRATION_GUIDE.md) - Data migration
- [`ENVIRONMENT_SETUP_GUIDE.md`](./ENVIRONMENT_SETUP_GUIDE.md) - ENV variables

### Helper Scripts
- `verify-setup.sh` - Verify domain & SSL setup
- `quick-migration.sh` - Automated migration
- `generate-secrets.sh` - Generate secure keys
- `kamatera-deploy.sh` - Deployment script

### Troubleshooting
- [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) - Common issues

---

## 🆘 Current Status & Next Steps

### ✅ Completed
- [x] Server setup on Kamatera
- [x] Docker containers running
- [x] Services accessible on server IP

### 🔄 In Progress
- [ ] **HIỆN TẠI:** Cấu hình Cloudflare DNS & SSL

### ⏭️ Next Steps

**Ngay bây giờ bạn cần làm:**

1. **Vào Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com
   ```

2. **Làm theo:** `CLOUDFLARE_SETUP_GUIDE.md`
   - Sections 2-7 (DNS, SSL, Nginx)

3. **Verify setup:**
   ```bash
   cd deploy
   ./verify-setup.sh yourdomain.com
   ```

4. **Khi verify pass, tiếp tục migration data:**
   ```bash
   ./quick-migration.sh all
   ```

---

## ⚡ Quick Commands Reference

```bash
# Check server status
ssh root@your-ip 'docker ps'

# View logs
ssh root@your-ip 'docker logs backend --tail 50'

# Restart service
ssh root@your-ip 'docker restart backend'

# Verify domain setup
./verify-setup.sh yourdomain.com

# Migration
./quick-migration.sh cms
./quick-migration.sh n8n
./quick-migration.sh mongo

# Full deployment
ssh root@your-ip
cd /root/deploy
docker-compose -f docker-compose.kamatera.yml pull
docker-compose -f docker-compose.kamatera.yml up -d
```

---

## 🎯 Success Criteria

Hệ thống coi như thành công khi:

- ✅ Frontend: https://yourdomain.com - Hiển thị trang chủ với products
- ✅ API: https://api.yourdomain.com - Trả về data
- ✅ CMS: https://cms.yourdomain.com/admin - Login được và có data
- ✅ N8N: https://n8n.yourdomain.com - Login được và có workflows
- ✅ SSL: Tất cả HTTPS, certificate valid, không có warning
- ✅ Features: Place order, payment, email đều work

---

## 📞 Need Help?

**Stuck ở bước nào?**

1. Check logs: `docker logs container_name`
2. Check documentation: `deploy/TROUBLESHOOTING.md`
3. Verify step by step: Follow checklist

**Common Issues:**

- DNS chưa propagate → Đợi 15-30 phút
- SSL certificate error → Check `/etc/ssl/cloudflare/` files
- Container not running → Check logs, restart container
- 502 Bad Gateway → Service chưa ready, check container health

---

**🚀 Good luck with your deployment!**
