# 🔧 Khắc phục lỗi CMS trên Render

## ❌ Lỗi hiện tại

```
npm error signal SIGTERM
npm error command sh -c strapi start
```

## 🔍 Nguyên nhân chính

### 1. **THIẾU PostgreSQL Driver**

Strapi cần package `pg` để kết nối PostgreSQL, nhưng `package.json` chỉ có `better-sqlite3`.

### 2. **Biến môi trường thiếu hoặc sai**

`APP_KEYS` là bắt buộc trong production, nếu thiếu sẽ crash ngay.

### 3. **PostgreSQL SSL Configuration**

Render PostgreSQL yêu cầu SSL, nhưng config mặc định có thể sai.

---

## ✅ Giải pháp

### **Bước 1: Thêm PostgreSQL driver**

```bash
cd my-cms
npm install pg --save
```

Hoặc thêm vào `package.json`:
```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "better-sqlite3": "12.4.1"
  }
}
```

### **Bước 2: Cập nhật database config cho Render**

Sửa `my-cms/config/database.ts`:

```typescript
import path from 'path';

export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite');

  const connections = {
    postgres: {
      connection: {
        connectionString: env('DATABASE_URL'),
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        ssl: env.bool('DATABASE_SSL', false) && {
          rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false),
        },
        schema: env('DATABASE_SCHEMA', 'public'),
      },
      pool: { 
        min: env.int('DATABASE_POOL_MIN', 2), 
        max: env.int('DATABASE_POOL_MAX', 10) 
      },
    },
    sqlite: {
      connection: {
        filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
```

**Key changes:**
- Đơn giản hóa SSL config
- `rejectUnauthorized: false` cho Render PostgreSQL
- Hỗ trợ cả `DATABASE_URL` và individual params

### **Bước 3: Kiểm tra biến môi trường trên Render**

Đảm bảo có **ĐẦY ĐỦ** các biến sau:

```bash
# ============================================
# Basic Configuration
# ============================================
NODE_ENV=production
HOST=0.0.0.0
PORT=10000

# ============================================
# Database - PostgreSQL
# ============================================
DATABASE_CLIENT=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Hoặc nếu dùng riêng lẻ:
# DATABASE_HOST=dpg-xxxxx.singapore-postgres.render.com
# DATABASE_PORT=5432
# DATABASE_NAME=strapi_cms
# DATABASE_USERNAME=strapi_user
# DATABASE_PASSWORD=your_password
# DATABASE_SSL=true

# ============================================
# Security Keys (QUAN TRỌNG!)
# ============================================
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=your_random_salt
ADMIN_JWT_SECRET=your_admin_secret
JWT_SECRET=your_jwt_secret
TRANSFER_TOKEN_SALT=your_transfer_salt
```

**⚠️ Cách generate keys:**
```bash
# Chạy script này
./tmp_rovodev_generate_keys.sh

# Hoặc manual:
node -e "console.log([...Array(4)].map(() => require('crypto').randomBytes(16).toString('base64')).join(','))"
```

### **Bước 4: Cập nhật Dockerfile (nếu dùng Docker)**

Đảm bảo build đúng:

```dockerfile
FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build Strapi admin panel
ENV NODE_ENV=production
RUN npm run build

# Remove devDependencies
RUN npm prune --production

EXPOSE 1337

CMD ["npm", "run", "start"]
```

**Key changes:**
- `npm ci` thay vì `npm ci --omit=dev` để build được
- Prune sau khi build

### **Bước 5: Kiểm tra Build Command trên Render**

Trong Render Dashboard → Your Service → Settings:

```bash
Build Command: npm install && npm run build
Start Command: npm start
```

---

## 🧪 Test local trước khi deploy

### Test với PostgreSQL local:

```bash
# 1. Start PostgreSQL local (Docker)
docker run -d \
  --name strapi-postgres-test \
  -e POSTGRES_DB=strapi \
  -e POSTGRES_USER=strapi \
  -e POSTGRES_PASSWORD=strapi \
  -p 5432:5432 \
  postgres:15-alpine

# 2. Tạo .env.test
cat > my-cms/.env.test << 'EOF'
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=strapi
APP_KEYS=test1,test2,test3,test4
API_TOKEN_SALT=testsalt123
ADMIN_JWT_SECRET=testadmin123
JWT_SECRET=testjwt123
TRANSFER_TOKEN_SALT=testtransfer123
EOF

# 3. Build và start
cd my-cms
npm install pg
npm run build
NODE_ENV=production npm start

# 4. Kiểm tra logs
# Nếu thấy "Server started on port 1337" -> OK!
```

---

## 🔍 Debug trên Render

### Xem logs chi tiết:

1. Render Dashboard → Your CMS Service
2. Logs tab
3. Tìm lỗi cụ thể:

**Lỗi thường gặp:**

#### ❌ "Cannot find module 'pg'"
```bash
# Giải pháp: Thêm pg vào dependencies
npm install pg --save
git add package.json package-lock.json
git commit -m "Add PostgreSQL driver"
git push
```

#### ❌ "APP_KEYS is required"
```bash
# Giải pháp: Thêm APP_KEYS vào Environment Variables
# Render Dashboard → Environment → Add Environment Variable
APP_KEYS=key1,key2,key3,key4
```

#### ❌ "Connection timeout" hoặc "SSL error"
```bash
# Giải pháp: Update database config
# Đảm bảo có:
DATABASE_SSL=true
# Và trong database.ts:
ssl: { rejectUnauthorized: false }
```

#### ❌ "Build failed"
```bash
# Giải pháp: Check Build Command
# Phải là: npm install && npm run build
# KHÔNG phải: npm ci --omit=dev
```

---

## 📝 Checklist hoàn chỉnh

### Prerequisites:
- [ ] Đã tạo PostgreSQL database trên Render
- [ ] Đã có DATABASE_URL từ Render
- [ ] Đã generate APP_KEYS và secrets

### Code changes:
- [ ] Thêm `pg` vào package.json
- [ ] Update database.ts (SSL config)
- [ ] Update Dockerfile (nếu dùng)
- [ ] Commit và push changes

### Render config:
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Environment Variables: đầy đủ tất cả keys
- [ ] DATABASE_URL: link đến Render PostgreSQL

### Testing:
- [ ] Test build local: `npm run build`
- [ ] Test với PostgreSQL local
- [ ] Deploy lên Render
- [ ] Check logs không có lỗi
- [ ] Truy cập /admin thành công

---

## 🚀 Quick Fix Script

Chạy script này để fix nhanh:

```bash
#!/bin/bash
echo "🔧 Fixing CMS for Render deployment..."

cd my-cms

# 1. Add PostgreSQL driver
echo "📦 Adding PostgreSQL driver..."
npm install pg --save

# 2. Update database config
echo "⚙️ Updating database config..."
cat > config/database.ts << 'EOF'
import path from 'path';

export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite');

  const connections = {
    postgres: {
      connection: {
        connectionString: env('DATABASE_URL'),
        ssl: env.bool('DATABASE_SSL', false) && {
          rejectUnauthorized: false,
        },
        schema: env('DATABASE_SCHEMA', 'public'),
      },
      pool: { 
        min: env.int('DATABASE_POOL_MIN', 2), 
        max: env.int('DATABASE_POOL_MAX', 10) 
      },
    },
    sqlite: {
      connection: {
        filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
EOF

# 3. Test build
echo "🏗️ Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "Next steps:"
    echo "1. git add ."
    echo "2. git commit -m 'Fix: Add PostgreSQL support for Render'"
    echo "3. git push"
    echo "4. Configure environment variables on Render"
else
    echo "❌ Build failed. Check errors above."
fi
```

---

## 📚 Environment Variables Template cho Render

Copy template này vào Render:

```bash
# Production
NODE_ENV=production
HOST=0.0.0.0
PORT=10000

# Database
DATABASE_CLIENT=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_SSL=true

# Security Keys - GENERATE MỚI!
APP_KEYS=<run: ./tmp_rovodev_generate_keys.sh>
API_TOKEN_SALT=<from script output>
ADMIN_JWT_SECRET=<from script output>
JWT_SECRET=<from script output>
TRANSFER_TOKEN_SALT=<from script output>

# Optional: Backend sync
# BACKEND_API_URL=https://your-backend.onrender.com
# BACKEND_API_KEY=your_api_key
```

---

**✅ Sau khi apply các fix trên, CMS sẽ start thành công trên Render!**

Nếu vẫn gặp lỗi, copy **full logs** từ Render và hỏi lại.
