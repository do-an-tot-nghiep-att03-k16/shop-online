# 🚀 Hướng dẫn Deploy lên Kamatera Server

## 📋 Yêu cầu

### Server Kamatera (Khuyến nghị):
- **OS**: Ubuntu 22.04 LTS
- **RAM**: 4GB - 8GB
- **CPU**: 2-4 cores
- **Storage**: 50GB+
- **Network**: Public IP, mở ports 80, 443, 5678

### GitHub Container Registry:
- Docker images đã được build và push lên GHCR
- Personal Access Token (nếu images là private)

## 🎯 Các bước thực hiện

### 1️⃣ Tạo server trên Kamatera

1. Đăng nhập vào [Kamatera Console](https://console.kamatera.com)
2. Chọn **Create New Server**
3. Cấu hình:
   ```
   Server Type: Cloud Server
   Operating System: Ubuntu 22.04 LTS
   RAM: 4096 MB (minimum)
   CPU: 2 Cores
   Storage: 50 GB SSD
   Network: 1000 Mbps (1 Gbps)
   Location: (Chọn gần người dùng nhất)
   ```
4. Tạo và lưu SSH key hoặc password
5. Khởi tạo server

### 2️⃣ Kết nối SSH vào server

```bash
# Thay YOUR_SERVER_IP bằng IP thực tế
ssh root@YOUR_SERVER_IP
```

### 3️⃣ Chuẩn bị môi trường

```bash
# Update hệ thống
apt update && apt upgrade -y

# Cài đặt các tools cần thiết
apt install -y git curl nano ufw

# Cấu hình firewall
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 5678/tcp    # N8N
ufw --force enable
```

### 4️⃣ Tải deployment files

#### Option A: Clone toàn bộ repository
```bash
cd /opt
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git clothing-shop
cd clothing-shop/deploy
```

#### Option B: Chỉ tải thư mục deploy
```bash
mkdir -p /opt/clothing-shop
cd /opt/clothing-shop

# Copy các file deployment từ máy local
# scp -r deploy/* root@YOUR_SERVER_IP:/opt/clothing-shop/
```

### 5️⃣ Chạy script deploy tự động

```bash
cd /opt/clothing-shop/deploy
chmod +x kamatera-deploy.sh
./kamatera-deploy.sh
```

Script sẽ tự động:
- ✅ Cài đặt Docker và Docker Compose
- ✅ Copy file env từ example
- ✅ Login vào GitHub Container Registry
- ✅ Pull Docker images
- ✅ Start tất cả containers

### 6️⃣ Cấu hình môi trường (Manual nếu cần)

#### Backend Environment (`env/backend.env`)

```bash
nano env/backend.env
```

**Cấu hình quan trọng:**
```env
# MongoDB (có thể dùng MongoDB Atlas - free tier)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/clothing-shop?retryWrites=true&w=majority

# JWT Secrets (generate random strings)
JWT_SECRET=your-super-secret-jwt-key-here
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-here

# CORS Origins (Cloudflare Pages hoặc domain của bạn)
CORS_ORIGINS=https://your-domain.com,https://your-frontend.pages.dev

# Email SMTP (Gmail, SendGrid, etc.)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASS=your-app-password

# Sepay Payment
SEPAY_WEBHOOK_SECRET=your-sepay-webhook-secret

# Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### CMS Environment (`env/cms.env`)

```bash
nano env/cms.env
```

```env
# Database (dùng MongoDB chung với backend)
DATABASE_CLIENT=mongo
DATABASE_NAME=clothing-shop-cms
DATABASE_HOST=mongo
DATABASE_PORT=27017
DATABASE_USERNAME=
DATABASE_PASSWORD=

# Admin JWT
ADMIN_JWT_SECRET=your-cms-admin-jwt-secret
JWT_SECRET=your-cms-jwt-secret

# App Keys (generate random strings)
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=your-api-token-salt
TRANSFER_TOKEN_SALT=your-transfer-token-salt
```

**Generate random secrets:**
```bash
# Tạo random strings cho JWT secrets
openssl rand -base64 32

# Hoặc dùng Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 7️⃣ Khởi động services

```bash
# Pull images từ GitHub
export GITHUB_OWNER=your-github-username
docker-compose pull

# Start all services
docker-compose up -d

# Xem logs
docker-compose logs -f
```

### 8️⃣ Kiểm tra deployment

```bash
# Kiểm tra container đang chạy
docker-compose ps

# Xem logs của từng service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f cms
docker-compose logs -f mongo
docker-compose logs -f redis

# Kiểm tra health
curl http://localhost:3000/health  # Backend
curl http://localhost:1337/_health # CMS
```

## 🌐 Truy cập ứng dụng

Sau khi deploy thành công:

| Service | URL | Mô tả |
|---------|-----|-------|
| **Frontend** | `http://YOUR_SERVER_IP` | Giao diện người dùng |
| **Backend API** | `http://YOUR_SERVER_IP/api` | REST API |
| **CMS Admin** | `http://YOUR_SERVER_IP/admin` | Strapi CMS |
| **N8N** | `http://YOUR_SERVER_IP:5678` | Automation workflows |

## 🔧 Các lệnh quản lý

### Xem logs
```bash
cd /opt/clothing-shop/deploy

# Tất cả services
docker-compose logs -f

# Một service cụ thể
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart services
```bash
# Restart tất cả
docker-compose restart

# Restart một service
docker-compose restart backend
```

### Stop/Start
```bash
# Stop
docker-compose down

# Start
docker-compose up -d
```

### Update images
```bash
# Pull images mới nhất
docker-compose pull

# Recreate containers với images mới
docker-compose up -d --force-recreate
```

### Backup data
```bash
# Backup MongoDB
docker exec mongo mongodump --out /data/backup

# Copy backup ra ngoài
docker cp mongo:/data/backup ./mongo-backup-$(date +%Y%m%d)

# Backup Redis
docker exec redis redis-cli SAVE
docker cp redis:/data/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb
```

## 🔒 Bảo mật

### 1. Cấu hình SSL/TLS

Sử dụng Cloudflare hoặc Let's Encrypt:

#### Option A: Cloudflare Origin Certificate
```bash
# Download certificate từ Cloudflare
# Copy vào /etc/ssl/cloudflare/

# Update nginx config để dùng SSL
nano nginx/conf.d/default.conf
```

#### Option B: Let's Encrypt (Certbot)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

### 2. Đổi passwords mặc định

```bash
# MongoDB (tạo admin user)
docker exec -it mongo mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "strong-password",
  roles: ["root"]
})

# Update env file với credentials mới
```

### 3. Giới hạn SSH access

```bash
# Chỉ cho phép SSH từ IP cụ thể
ufw delete allow 22/tcp
ufw allow from YOUR_HOME_IP to any port 22
```

## 📊 Monitoring

### Xem resource usage
```bash
# CPU và Memory
docker stats

# Disk usage
df -h
docker system df
```

### Health checks
```bash
# Backend health
curl http://localhost:3000/v1/api/jobs/health

# CMS health
curl http://localhost:1337/_health
```

## 🐛 Troubleshooting

### Containers không start
```bash
# Xem logs chi tiết
docker-compose logs --tail=100 [service-name]

# Kiểm tra ports
netstat -tulpn | grep LISTEN
```

### Out of memory
```bash
# Kiểm tra memory
free -h

# Restart container tốn nhiều memory nhất
docker stats
docker-compose restart [service-name]
```

### MongoDB connection issues
```bash
# Vào MongoDB shell
docker exec -it mongo mongosh

# Kiểm tra databases
show dbs
use clothing-shop
show collections
```

### Images pull failed
```bash
# Re-login GitHub Container Registry
docker login ghcr.io -u your-github-username

# Pull lại images
export GITHUB_OWNER=your-github-username
docker-compose pull
```

## 📞 Hỗ trợ

- **GitHub Issues**: [Link to your repo]/issues
- **Documentation**: Các file MD trong thư mục root
- **Contact**: your-email@example.com

---

## ⚡ Quick Commands Reference

```bash
# Deploy mới lần đầu
./kamatera-deploy.sh

# Update code mới nhất
docker-compose pull && docker-compose up -d --force-recreate

# Xem logs realtime
docker-compose logs -f

# Restart một service
docker-compose restart backend

# Stop tất cả
docker-compose down

# Backup database
docker exec mongo mongodump --out /data/backup

# Kiểm tra health
curl http://localhost:3000/v1/api/jobs/health
```

---

**Chúc bạn deploy thành công! 🎉**
