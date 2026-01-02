# 🔧 Troubleshooting Guide - Kamatera Deployment

## 1. Lỗi: `Cannot destructure property 'db'`

### Triệu chứng:
```
TypeError: Cannot destructure property 'db' of 'require(...)' as it is undefined.
```

### Nguyên nhân:
Backend cần biến môi trường MongoDB nhưng không tìm thấy.

### Giải pháp:

#### Option A: Dùng MONGODB_URI (Khuyên dùng cho MongoDB Atlas)

File `env/backend.env`:
```env
NODE_ENV=production

# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority
```

**Ưu điểm:**
- ✅ Đơn giản, chỉ cần 1 biến
- ✅ Code tự động ưu tiên dùng MONGODB_URI
- ✅ Phù hợp với MongoDB Atlas

#### Option B: Dùng PRO_DB_* variables

File `env/backend.env`:
```env
NODE_ENV=production

# Phải comment hoặc xóa MONGODB_URI nếu dùng cách này
# MONGODB_URI=...

PRO_DB_HOST=cluster0.xxxxx.mongodb.net
PRO_DB_PORT=27017
PRO_DB_NAME=clothing_shop
```

**Lưu ý:** 
- Nếu có cả `MONGODB_URI` và `PRO_DB_*`, code sẽ ưu tiên `MONGODB_URI`
- Với MongoDB Atlas, `PRO_DB_HOST` phải là domain đầy đủ (ví dụ: `cluster0.abc123.mongodb.net`)

---

## 2. Lỗi: Redis connection failed

### Triệu chứng:
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

### Nguyên nhân:
Backend đang cố kết nối Redis ở `127.0.0.1` thay vì tên container.

### Giải pháp:

File `env/backend.env`:
```env
# ĐÚNG - Dùng tên container
REDIS_URL=redis://redis:6379

# SAI - Không dùng 127.0.0.1 khi chạy trong Docker
# REDIS_HOST=127.0.0.1
```

---

## 3. Lỗi: CMS không kết nối được PostgreSQL

### Triệu chứng:
```
Error: connect ECONNREFUSED cms-postgres:5432
```

### Nguyên nhân:
PostgreSQL container chưa sẵn sàng hoặc password không khớp.

### Giải pháp:

1. **Kiểm tra PostgreSQL đang chạy:**
```bash
docker ps | grep cms-postgres
```

2. **Kiểm tra password khớp:**

File `docker-compose.yml`:
```yaml
cms-postgres:
  environment:
    POSTGRES_PASSWORD: ${CMS_DB_PASSWORD}
```

File `env/cms.env`:
```env
DATABASE_PASSWORD=same_password_here
```

3. **Test connection:**
```bash
docker exec cms-postgres psql -U strapi -d strapi -c "SELECT 1;"
```

---

## 4. Lỗi: Cannot pull images from GHCR

### Triệu chứng:
```
Error: pull access denied for ghcr.io/username/repo
```

### Nguyên nhân:
- Repository là private và chưa login
- Hoặc `GITHUB_OWNER` không đúng

### Giải pháp:

1. **Set GITHUB_OWNER đúng:**
```bash
export GITHUB_OWNER=your-github-username
```

2. **Login GHCR (nếu private repo):**
```bash
# Tạo Personal Access Token tại: https://github.com/settings/tokens
# Cần quyền: read:packages

docker login ghcr.io -u YOUR_USERNAME
# Nhập token khi được hỏi password
```

3. **Pull lại:**
```bash
docker compose pull
```

---

## 5. Lỗi: Frontend không kết nối được Backend

### Triệu chứng:
Frontend báo lỗi CORS hoặc không gọi được API.

### Nguyên nhân:
Frontend được build với URL sai hoặc backend chưa config CORS.

### Giải pháp:

1. **Kiểm tra backend CORS:**

File `env/backend.env`:
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

2. **Rebuild frontend nếu cần thay đổi API URL:**
```bash
# Build với đúng API URL
docker build --build-arg VITE_API_BASE_URL=https://api.yourdomain.com \
  -t ghcr.io/username/frontend-clothing-shop:latest \
  ./frontend-clothing-shop
```

---

## 6. Lỗi: Container keep restarting

### Triệu chứng:
```bash
docker ps
# Container status: Restarting (1) 10 seconds ago
```

### Giải pháp:

1. **Xem logs để tìm lỗi:**
```bash
docker logs backend --tail 100
docker logs cms --tail 100
```

2. **Kiểm tra file env có đúng format:**
```bash
# File env không được có khoảng trắng thừa
# ĐÚNG:
KEY=value

# SAI:
KEY = value
```

3. **Kiểm tra dependencies:**
```bash
# Backend cần Redis phải chạy trước
# CMS cần PostgreSQL phải chạy trước

docker ps | grep redis
docker ps | grep postgres
```

---

## 7. Lỗi: Out of memory

### Triệu chứng:
```
Cannot allocate memory
OOMKilled
```

### Giải pháp:

1. **Kiểm tra RAM:**
```bash
free -h
```

2. **Tắt services không cần thiết:**
```bash
# Nếu không dùng N8N, comment trong docker-compose.yml
# n8n:
#   ...
# n8n-postgres:
#   ...
```

3. **Giới hạn memory cho containers:**

File `docker-compose.yml`:
```yaml
backend:
  mem_limit: 512m
  
cms:
  mem_limit: 512m
```

---

## 8. Commands hữu ích

### Xem logs real-time:
```bash
docker compose logs -f
docker logs backend -f
docker logs cms -f
```

### Restart một service:
```bash
docker compose restart backend
docker compose restart cms
```

### Restart toàn bộ:
```bash
docker compose down
docker compose up -d
```

### Xem biến môi trường của container:
```bash
docker exec backend env
docker exec cms env
```

### Vào shell của container:
```bash
docker exec -it backend sh
docker exec -it cms sh
```

### Kiểm tra disk space:
```bash
df -h
docker system df
```

### Dọn dẹp Docker (cẩn thận!):
```bash
# Xóa images không dùng
docker image prune -a

# Xóa volumes không dùng (CẨN THẬN - Mất data!)
docker volume prune

# Xóa tất cả (CẨN THẬN!)
docker system prune -a --volumes
```

---

## 9. Health Check

Script kiểm tra tất cả services:

```bash
#!/bin/bash

echo "🔍 Checking all services..."
echo ""

# Backend
echo "📦 Backend:"
curl -s http://localhost:3000/health && echo "✅ OK" || echo "❌ FAIL"
echo ""

# CMS
echo "📦 CMS:"
curl -s http://localhost:1337/_health && echo "✅ OK" || echo "❌ FAIL"
echo ""

# Redis
echo "📦 Redis:"
docker exec redis redis-cli ping && echo "✅ OK" || echo "❌ FAIL"
echo ""

# PostgreSQL
echo "📦 PostgreSQL:"
docker exec cms-postgres pg_isready -U strapi && echo "✅ OK" || echo "❌ FAIL"
echo ""

# Containers status
echo "📊 Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Lưu script này thành `check-health.sh` và chạy:
```bash
chmod +x check-health.sh
./check-health.sh
```
