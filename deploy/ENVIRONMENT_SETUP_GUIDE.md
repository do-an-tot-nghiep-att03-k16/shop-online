# 🔧 Hướng dẫn cấu hình Environment Variables

## 📋 Tổng quan

Bạn cần cấu hình 2 file chính:
1. **`env/backend.env`** - Backend API (Node.js/Express)
2. **`env/cms.env`** - Strapi CMS

---

## 🚀 BƯỚC 1: Copy files từ example

```bash
cd /opt/clothing-shop/deploy

# Copy example files
cp env/backend.env.example env/backend.env
cp env/cms.env.example env/cms.env
```

---

## 📝 BƯỚC 2: Cấu hình Backend (`env/backend.env`)

### 2.1. Basic Settings (Giữ nguyên)

```bash
NODE_ENV=production
PORT=3000
```

---

### 2.2. 🗄️ MongoDB Database

**Option A: Dùng MongoDB local (trong Docker Compose)**
```bash
MONGODB_URI=mongodb://mongo:27017/clothing-shop
```

**Option B: Dùng MongoDB Atlas (Cloud - RECOMMENDED)**

1. Đăng ký miễn phí tại: https://www.mongodb.com/cloud/atlas
2. Tạo free cluster (M0 - 512MB)
3. Tạo database user và password
4. Whitelist IP: `0.0.0.0/0` (Allow from anywhere)
5. Copy connection string:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/clothing-shop?retryWrites=true&w=majority
```

**Thay thế:**
- `username` → MongoDB user của bạn
- `password` → Password (URL encode nếu có ký tự đặc biệt)
- `cluster0.xxxxx` → Cluster name của bạn
- `clothing-shop` → Database name

---

### 2.3. 🔴 Redis Cache

**Dùng Redis trong Docker Compose:**
```bash
REDIS_URL=redis://redis:6379
```

---

### 2.4. 🔐 JWT Secrets (QUAN TRỌNG!)

**Generate random secrets:**

```bash
# Cách 1: Dùng OpenSSL
openssl rand -base64 32

# Cách 2: Dùng Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Cách 3: Online
# https://www.random.org/strings/
```

**Ví dụ output:**
```
dK7mN9pQ2rS5tU8vW1xY4zA6bC3eF0gH
```

**Điền vào file:**
```bash
JWT_SECRET=dK7mN9pQ2rS5tU8vW1xY4zA6bC3eF0gH
REFRESH_TOKEN_SECRET=aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0u
```

⚠️ **LƯU Ý:** Mỗi secret phải KHÁC NHAU và GIỮ BÍ MẬT!

---

### 2.5. 🌐 CORS Origins

**Định dạng:** Danh sách domain cách nhau bởi dấu phẩy, KHÔNG có khoảng trắng

```bash
# Development
CORS_ORIGINS=http://localhost:5173,http://localhost

# Production với Cloudflare Pages
CORS_ORIGINS=https://your-app.pages.dev,https://your-domain.com,https://www.your-domain.com

# Kamatera với domain
CORS_ORIGINS=https://aristia.shop,https://www.aristia.shop

# Kamatera chỉ có IP (tạm thời)
CORS_ORIGINS=http://YOUR_SERVER_IP
```

**Ví dụ thực tế:**
```bash
CORS_ORIGINS=https://aristia.shop,https://www.aristia.shop,https://admin.aristia.shop
```

---

### 2.6. 📧 Email SMTP (Optional - cho Reset Password, Order Confirmation)

#### **Option A: Gmail**

1. Bật 2-Step Verification trong Google Account
2. Tạo App Password: https://myaccount.google.com/apppasswords
3. Cấu hình:

```bash
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASS=your-app-password-16-chars
```

#### **Option B: SendGrid (Recommended for production)**

1. Đăng ký: https://sendgrid.com (Free 100 emails/day)
2. Tạo API Key
3. Cấu hình:

```bash
EMAIL_SMTP_HOST=smtp.sendgrid.net
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=apikey
EMAIL_SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### **Option C: Mailtrap (Testing only)**

```bash
EMAIL_SMTP_HOST=smtp.mailtrap.io
EMAIL_SMTP_PORT=2525
EMAIL_SMTP_USER=your-mailtrap-username
EMAIL_SMTP_PASS=your-mailtrap-password
```

#### **Skip Email (Để trống nếu chưa cần)**
```bash
EMAIL_SMTP_HOST=
EMAIL_SMTP_USER=
EMAIL_SMTP_PASS=
```

---

### 2.7. 💳 Sepay Payment Webhook (Optional)

**Nếu dùng Sepay cho thanh toán:**

1. Đăng ký tài khoản Sepay
2. Lấy Webhook Secret từ dashboard
3. Cấu hình:

```bash
SEPAY_WEBHOOK_SECRET=your-sepay-webhook-secret-here
```

**Nếu chưa dùng (để trống):**
```bash
SEPAY_WEBHOOK_SECRET=
```

---

### 2.8. ☁️ Cloudinary Upload (Optional - nếu dùng)

**Nếu backend có cấu hình Cloudinary cho upload ảnh:**

```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-api-secret
```

---

### ✅ **File `backend.env` hoàn chỉnh mẫu:**

```bash
# Basic
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb+srv://admin:MyPass123@cluster0.abc123.mongodb.net/clothing-shop?retryWrites=true&w=majority
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=dK7mN9pQ2rS5tU8vW1xY4zA6bC3eF0gH
REFRESH_TOKEN_SECRET=aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0u

# CORS
CORS_ORIGINS=https://aristia.shop,https://www.aristia.shop

# Email (Gmail)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=shop@aristia.shop
EMAIL_SMTP_PASS=abcd efgh ijkl mnop

# Payment (optional)
SEPAY_WEBHOOK_SECRET=sepay_secret_key_here

# Upload (optional)
CLOUDINARY_CLOUD_NAME=my-shop
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnop
```

---

## 📝 BƯỚC 3: Cấu hình CMS (`env/cms.env`)

### 3.1. Basic Settings (Giữ nguyên)

```bash
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
```

---

### 3.2. 🔐 Strapi Security Keys

**Generate 4 random keys:**

```bash
# Chạy 4 lần để có 4 keys khác nhau
openssl rand -base64 32
```

**Ví dụ output:**
```
Key1: dK7mN9pQ2rS5tU8vW1xY4zA6bC3eF0gH
Key2: aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0u
Key3: xY9zA8bC7dE6fG5hI4jK3lM2nO1pQ0r
Key4: pL9oK8iJ7hG6fE5dC4bA3zY2xW1vU0t
```

**Điền vào file (cách nhau bởi dấu phẩy):**
```bash
APP_KEYS=dK7mN9pQ2rS5tU8vW1xY4zA6bC3eF0gH,aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0u,xY9zA8bC7dE6fG5hI4jK3lM2nO1pQ0r,pL9oK8iJ7hG6fE5dC4bA3zY2xW1vU0t

API_TOKEN_SALT=another-random-salt-32-chars-here
ADMIN_JWT_SECRET=admin-jwt-secret-32-chars-here
TRANSFER_TOKEN_SALT=transfer-salt-32-chars-here
JWT_SECRET=cms-jwt-secret-32-chars-here
```

---

### 3.3. 🗄️ Database

#### **Option A: SQLite (Simple - cho testing)**

```bash
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

⚠️ **Lưu ý:** SQLite lưu trong container, dễ mất data khi restart!

#### **Option B: MongoDB (RECOMMENDED - dùng chung với Backend)**

```bash
DATABASE_CLIENT=mongo
DATABASE_NAME=clothing-shop-cms
DATABASE_HOST=mongo
DATABASE_PORT=27017
DATABASE_USERNAME=
DATABASE_PASSWORD=
```

**Hoặc dùng MongoDB Atlas:**
```bash
DATABASE_CLIENT=mongo
DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/clothing-shop-cms?retryWrites=true&w=majority
```

#### **Option C: PostgreSQL (Production grade)**

```bash
DATABASE_CLIENT=postgres
DATABASE_HOST=your-postgres-host
DATABASE_PORT=5432
DATABASE_NAME=cms_db
DATABASE_USERNAME=postgres_user
DATABASE_PASSWORD=postgres_pass
DATABASE_SSL=false
```

---

### ✅ **File `cms.env` hoàn chỉnh mẫu:**

```bash
# Basic
NODE_ENV=production
HOST=0.0.0.0
PORT=1337

# Security Keys (4 random keys)
APP_KEYS=dK7mN9pQ2rS5tU8vW1xY4zA6bC3eF0gH,aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0u,xY9zA8bC7dE6fG5hI4jK3lM2nO1pQ0r,pL9oK8iJ7hG6fE5dC4bA3zY2xW1vU0t
API_TOKEN_SALT=aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0u
ADMIN_JWT_SECRET=xY9zA8bC7dE6fG5hI4jK3lM2nO1pQ0r
TRANSFER_TOKEN_SALT=pL9oK8iJ7hG6fE5dC4bA3zY2xW1vU0t
JWT_SECRET=qR9sT0uV1wX2yZ3aB4cD5eF6gH7iJ8k

# Database - MongoDB (dùng chung container)
DATABASE_CLIENT=mongo
DATABASE_NAME=clothing-shop-cms
DATABASE_HOST=mongo
DATABASE_PORT=27017
DATABASE_USERNAME=
DATABASE_PASSWORD=

# Or SQLite (simple)
# DATABASE_CLIENT=sqlite
# DATABASE_FILENAME=.tmp/data.db
```

---

## 🔧 BƯỚC 4: Apply configuration

```bash
cd /opt/clothing-shop/deploy

# Kiểm tra files đã tạo
ls -la env/

# Edit nếu cần
nano env/backend.env
nano env/cms.env

# Set GitHub owner
export GITHUB_OWNER=qingyunne

# Pull images (nếu chưa pull)
docker-compose pull

# Start services
docker-compose up -d

# Xem logs để check
docker-compose logs -f
```

---

## ✅ BƯỚC 5: Verify configuration

### Kiểm tra Backend:
```bash
# Health check
curl http://localhost:3000/v1/api/jobs/health

# Expected output:
# {"status":"ok","timestamp":"..."}
```

### Kiểm tra CMS:
```bash
# Health check
curl http://localhost:1337/_health

# Expected output:
# {"status":"ok"}
```

### Kiểm tra logs:
```bash
# Backend logs
docker-compose logs -f backend

# CMS logs
docker-compose logs -f cms

# All logs
docker-compose logs -f
```

---

## 🔒 Bảo mật

### ⚠️ QUAN TRỌNG:

1. **KHÔNG commit file `.env` lên Git**
   ```bash
   # Đã có trong .gitignore
   env/backend.env
   env/cms.env
   ```

2. **Backup secrets an toàn**
   ```bash
   # Copy vào nơi an toàn (1Password, Bitwarden, etc.)
   cat env/backend.env
   cat env/cms.env
   ```

3. **Generate secrets mạnh**
   - Tối thiểu 32 ký tự
   - Random, không đoán được
   - Mỗi secret phải khác nhau

4. **Restrict MongoDB access**
   - Dùng MongoDB Atlas với IP whitelist
   - Hoặc dùng MongoDB local không expose port ra ngoài

---

## 🐛 Troubleshooting

### Backend không start:

```bash
# Xem logs chi tiết
docker-compose logs backend

# Common issues:
# - MongoDB connection failed → Check MONGODB_URI
# - Redis connection failed → Check REDIS_URL
# - JWT secret missing → Check JWT_SECRET
```

### CMS không start:

```bash
# Xem logs
docker-compose logs cms

# Common issues:
# - APP_KEYS missing or invalid format
# - Database connection failed
# - Port 1337 already in use
```

### Generate secrets script:

```bash
# Tạo script helper
cat > generate-secrets.sh << 'EOF'
#!/bin/bash
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)"
echo "ADMIN_JWT_SECRET=$(openssl rand -base64 32)"
echo "API_TOKEN_SALT=$(openssl rand -base64 32)"
echo "TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)"
echo ""
echo "APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)"
EOF

chmod +x generate-secrets.sh
./generate-secrets.sh
```

---

## 📞 Support

- **MongoDB Atlas**: https://www.mongodb.com/docs/atlas/
- **Strapi Docs**: https://docs.strapi.io/
- **Docker Compose**: https://docs.docker.com/compose/

---

**Chúc bạn cấu hình thành công! 🎉**
