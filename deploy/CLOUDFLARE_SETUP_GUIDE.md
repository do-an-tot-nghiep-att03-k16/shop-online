# ☁️ Hướng Dẫn Cấu Hình Cloudflare cho Kamatera Server

## Tổng Quan

Hướng dẫn này giúp bạn:
1. ✅ Cấu hình DNS trên Cloudflare trỏ về Kamatera server
2. ✅ Tạo SSL certificates cho HTTPS
3. ✅ Cấu hình nginx reverse proxy
4. ✅ Test và verify domain hoạt động

---

## Bước 1: Chuẩn Bị

### Thông tin cần có:
- ✅ Domain name (ví dụ: `yourdomain.com`)
- ✅ Kamatera server IP address (ví dụ: `1.2.3.4`)
- ✅ Tài khoản Cloudflare (free plan là đủ)
- ✅ Server đang chạy Docker containers

### Kiểm tra server status:
```bash
# SSH vào server
ssh root@your-kamatera-ip

# Check containers đang chạy
docker ps

# Expected output:
# - reverse-proxy (nginx)
# - frontend
# - backend
# - cms
# - cms-postgres
# - n8n
# - n8n-postgres
# - redis
```

---

## Bước 2: Thêm Domain vào Cloudflare

### 2.1. Add Site to Cloudflare

1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **"Add a Site"**
3. Nhập domain của bạn: `yourdomain.com`
4. Chọn plan **Free**
5. Click **"Continue"**

### 2.2. Cập nhật Nameservers

Cloudflare sẽ cung cấp 2 nameservers, ví dụ:
```
aron.ns.cloudflare.com
june.ns.cloudflare.com
```

**Vào nhà cung cấp domain (GoDaddy, Namecheap, etc.) và cập nhật nameservers:**

#### GoDaddy:
1. Vào **"My Products"** → chọn domain
2. Click **"DNS"** → **"Change nameservers"**
3. Chọn **"Custom"**
4. Nhập 2 nameservers từ Cloudflare
5. Save

#### Namecheap:
1. Vào **"Domain List"** → chọn domain
2. Click **"Manage"**
3. Tìm **"Nameservers"** → chọn **"Custom DNS"**
4. Nhập 2 nameservers
5. Save

⏱️ **Thời gian propagation:** 5 phút - 48 giờ (thường là 15-30 phút)

---

## Bước 3: Cấu Hình DNS Records

Sau khi nameservers active, thêm DNS records:

### 3.1. DNS Records cơ bản

Vào **Cloudflare Dashboard** → chọn domain → **DNS** → **Records**

Thêm các records sau:

| Type | Name | Content | Proxy Status | TTL |
|------|------|---------|--------------|-----|
| A | @ | `your-kamatera-ip` | ✅ Proxied | Auto |
| A | www | `your-kamatera-ip` | ✅ Proxied | Auto |
| A | api | `your-kamatera-ip` | ✅ Proxied | Auto |
| A | cms | `your-kamatera-ip` | ✅ Proxied | Auto |
| A | n8n | `your-kamatera-ip` | ✅ Proxied | Auto |

**Giải thích:**
- `@` → `yourdomain.com` (trang chủ frontend)
- `www` → `www.yourdomain.com` (alias của trang chủ)
- `api` → `api.yourdomain.com` (backend API)
- `cms` → `cms.yourdomain.com` (Strapi admin)
- `n8n` → `n8n.yourdomain.com` (N8N workflows)

### 3.2. Verify DNS Propagation

```bash
# Check từ local machine
nslookup yourdomain.com
nslookup api.yourdomain.com
nslookup cms.yourdomain.com

# Hoặc dùng online tools:
# https://dnschecker.org
```

---

## Bước 4: Cấu Hình SSL/TLS

### 4.1. Cloudflare SSL/TLS Settings

Vào **SSL/TLS** tab:

1. **Encryption Mode:** Chọn **"Full (strict)"** hoặc **"Full"**
   - Full: Cloudflare ↔ Server dùng SSL (có thể self-signed)
   - Full (strict): Yêu cầu valid certificate trên server

2. **Edge Certificates:**
   - ✅ Always Use HTTPS: **ON**
   - ✅ Automatic HTTPS Rewrites: **ON**
   - ✅ Minimum TLS Version: **TLS 1.2**

### 4.2. Tạo Origin Certificate

Đây là certificate để encrypt traffic giữa Cloudflare và server của bạn.

1. Vào **SSL/TLS** → **Origin Server**
2. Click **"Create Certificate"**
3. Settings:
   - Private key type: **RSA (2048)**
   - Hostnames: 
     ```
     *.yourdomain.com
     yourdomain.com
     ```
   - Certificate Validity: **15 years**
4. Click **"Create"**

Cloudflare sẽ hiển thị:
- **Origin Certificate** (file `.pem`)
- **Private Key** (file `.key`)

**⚠️ QUAN TRỌNG:** Copy cả 2 files này!

---

## Bước 5: Upload SSL Certificates lên Server

### 5.1. Tạo thư mục SSL trên server

```bash
# SSH vào server
ssh root@your-kamatera-ip

# Tạo thư mục
mkdir -p /etc/ssl/cloudflare
cd /etc/ssl/cloudflare
```

### 5.2. Upload certificates

**Option A: Copy/Paste (Recommended for first time)**

```bash
# Tạo origin certificate file
nano /etc/ssl/cloudflare/origin.pem
# Paste nội dung Origin Certificate
# Ctrl+X, Y, Enter để save

# Tạo private key file
nano /etc/ssl/cloudflare/origin.key
# Paste nội dung Private Key
# Ctrl+X, Y, Enter để save

# Set permissions
chmod 600 /etc/ssl/cloudflare/origin.key
chmod 644 /etc/ssl/cloudflare/origin.pem
```

**Option B: SCP từ local (nếu đã save files)**

```bash
# Trên máy local
scp origin.pem root@your-kamatera-ip:/etc/ssl/cloudflare/
scp origin.key root@your-kamatera-ip:/etc/ssl/cloudflare/

# SSH vào server và set permissions
ssh root@your-kamatera-ip
chmod 600 /etc/ssl/cloudflare/origin.key
chmod 644 /etc/ssl/cloudflare/origin.pem
```

### 5.3. Verify certificates uploaded

```bash
ls -la /etc/ssl/cloudflare/

# Expected output:
# -rw-r--r-- 1 root root 1234 ... origin.pem
# -rw------- 1 root root 5678 ... origin.key
```

---

## Bước 6: Cấu Hình Nginx Reverse Proxy

### 6.1. Tạo nginx config

```bash
# Trên server, vào thư mục deploy
cd /root/deploy
mkdir -p nginx/conf.d

# Tạo config file
nano nginx/conf.d/default.conf
```

### 6.2. Nội dung file `default.conf`

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com api.yourdomain.com cms.yourdomain.com n8n.yourdomain.com;
    return 301 https://$host$request_uri;
}

# Frontend - Main Website
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/ssl/cloudflare/origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 100M;

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/ssl/cloudflare/origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 100M;

    location / {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers (nếu cần)
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    }
}

# Strapi CMS Admin
server {
    listen 443 ssl http2;
    server_name cms.yourdomain.com;

    ssl_certificate /etc/ssl/cloudflare/origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 100M;

    location / {
        proxy_pass http://cms:1337;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# N8N Workflows
server {
    listen 443 ssl http2;
    server_name n8n.yourdomain.com;

    ssl_certificate /etc/ssl/cloudflare/origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 100M;

    location / {
        proxy_pass http://n8n:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
    }
}
```

**⚠️ Thay `yourdomain.com` bằng domain thực của bạn!**

### 6.3. Verify nginx config

```bash
# Test config syntax
docker exec reverse-proxy nginx -t

# Expected output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 6.4. Reload nginx

```bash
# Reload nginx để apply config
docker exec reverse-proxy nginx -s reload

# Hoặc restart container
docker restart reverse-proxy
```

---

## Bước 7: Cập Nhật Environment Variables

### 7.1. Update Backend ENV

```bash
cd /root/deploy
nano env/backend.env
```

Cập nhật:
```bash
# CORS Origins - Add your domains
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Allowed Origins
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://cms.yourdomain.com
```

### 7.2. Update CMS ENV

```bash
nano env/cms.env
```

Cập nhật:
```bash
# Public URL
PUBLIC_URL=https://cms.yourdomain.com

# Admin URL
ADMIN_URL=/admin
```

### 7.3. Update N8N ENV

```bash
nano env/n8n.env
```

Cập nhật:
```bash
N8N_HOST=n8n.yourdomain.com
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.yourdomain.com/
```

### 7.4. Restart containers

```bash
cd /root/deploy

# Restart để apply ENV changes
docker-compose -f docker-compose.kamatera.yml restart backend cms n8n
```

---

## Bước 8: Testing & Verification

### 8.1. Test từ browser

Mở các URLs sau và kiểm tra:

1. **Frontend:**
   - https://yourdomain.com ✅
   - https://www.yourdomain.com ✅

2. **Backend API:**
   - https://api.yourdomain.com/health ✅

3. **CMS Admin:**
   - https://cms.yourdomain.com/admin ✅

4. **N8N:**
   - https://n8n.yourdomain.com ✅

### 8.2. Test SSL Certificate

```bash
# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Hoặc dùng online tool:
# https://www.ssllabs.com/ssltest/
```

### 8.3. Test từ command line

```bash
# Test HTTPS
curl -I https://yourdomain.com
curl -I https://api.yourdomain.com
curl -I https://cms.yourdomain.com
curl -I https://n8n.yourdomain.com

# Check HTTP → HTTPS redirect
curl -I http://yourdomain.com
# Should return: 301 Moved Permanently
```

### 8.4. Check container logs

```bash
# Check nginx logs
docker logs reverse-proxy --tail 50

# Check backend logs
docker logs backend --tail 50

# Check CMS logs
docker logs cms --tail 50

# Check N8N logs
docker logs n8n --tail 50
```

---

## Bước 9: Cloudflare Additional Settings (Optional)

### 9.1. Caching

Vào **Caching** → **Configuration**:
- Caching Level: **Standard**
- Browser Cache TTL: **4 hours**

### 9.2. Speed Optimization

Vào **Speed** → **Optimization**:
- ✅ Auto Minify: Enable cho JavaScript, CSS, HTML
- ✅ Brotli compression: Enable

### 9.3. Security

Vào **Security** → **Settings**:
- Security Level: **Medium**
- ✅ Bot Fight Mode: Enable (free plan)

### 9.4. Firewall Rules (Optional)

Để bảo vệ CMS admin panel:

Vào **Security** → **WAF** → **Firewall Rules**

**Rule 1: Block non-Vietnam traffic to CMS**
```
(http.host eq "cms.yourdomain.com" and ip.geoip.country ne "VN")
Then: Block
```

**Rule 2: Rate limiting for API**
```
(http.host eq "api.yourdomain.com")
Then: Rate Limit (100 requests per minute)
```

---

## Bước 10: Troubleshooting

### Lỗi: "502 Bad Gateway"

**Nguyên nhân:** Container chưa ready hoặc không chạy

```bash
# Check containers
docker ps

# Check logs
docker logs backend --tail 50
docker logs cms --tail 50

# Restart container
docker restart backend
docker restart cms
```

### Lỗi: "SSL Handshake Failed"

**Nguyên nhân:** Certificates không đúng hoặc permissions sai

```bash
# Check certificates exist
ls -la /etc/ssl/cloudflare/

# Check permissions
chmod 600 /etc/ssl/cloudflare/origin.key
chmod 644 /etc/ssl/cloudflare/origin.pem

# Test nginx config
docker exec reverse-proxy nginx -t

# Reload nginx
docker exec reverse-proxy nginx -s reload
```

### Lỗi: "NET::ERR_CERT_AUTHORITY_INVALID"

**Nguyên nhân:** Cloudflare Proxy chưa active hoặc DNS chưa propagate

```bash
# Check DNS
nslookup yourdomain.com

# Verify Cloudflare Proxy Status
# Vào Cloudflare Dashboard → DNS → Records
# Đảm bảo "Proxy status" là "Proxied" (cloud màu cam)
```

### Domain không resolve

**Nguyên nhân:** DNS chưa propagate hoặc nameservers chưa update

```bash
# Check nameservers
dig yourdomain.com NS

# Should show Cloudflare nameservers:
# aron.ns.cloudflare.com
# june.ns.cloudflare.com

# Clear DNS cache (local)
# Windows: ipconfig /flushdns
# macOS: sudo dscacheutil -flushcache
# Linux: sudo systemd-resolve --flush-caches
```

### CORS errors

**Nguyên nhân:** CORS_ORIGINS không đúng

```bash
# Update backend.env
nano /root/deploy/env/backend.env

# Ensure:
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Restart
docker restart backend
```

---

## Checklist Hoàn Thành

- [ ] Domain đã add vào Cloudflare
- [ ] Nameservers đã cập nhật tại domain provider
- [ ] DNS records đã tạo (A records cho @, www, api, cms, n8n)
- [ ] DNS đã propagate (test bằng nslookup/dig)
- [ ] SSL/TLS mode đã set thành "Full" hoặc "Full (strict)"
- [ ] Origin certificate đã tạo và upload lên server
- [ ] Nginx config đã cập nhật với domain thực
- [ ] Environment variables đã cập nhật (backend, cms, n8n)
- [ ] Containers đã restart để apply changes
- [ ] Tất cả URLs đã test và hoạt động (frontend, backend, cms, n8n)
- [ ] SSL certificate valid (check bằng browser hoặc ssllabs.com)
- [ ] HTTP → HTTPS redirect hoạt động
- [ ] Logs không có errors nghiêm trọng

---

## Bước Tiếp Theo

Sau khi domain và SSL hoạt động:

✅ **Bây giờ bạn có thể migration dữ liệu!**

Xem: [`DATA_MIGRATION_GUIDE.md`](./DATA_MIGRATION_GUIDE.md)

---

## Quick Reference Commands

```bash
# Check DNS
nslookup yourdomain.com
dig yourdomain.com

# Test HTTPS
curl -I https://yourdomain.com

# Check SSL certificate
openssl s_client -connect yourdomain.com:443

# Verify nginx config
docker exec reverse-proxy nginx -t

# Reload nginx
docker exec reverse-proxy nginx -s reload

# Restart containers
docker restart reverse-proxy backend cms n8n

# Check logs
docker logs reverse-proxy --tail 50
docker logs backend --tail 50
docker logs cms --tail 50

# Check certificate files
ls -la /etc/ssl/cloudflare/
```

---

**🎉 Xong! Domain của bạn đã sẵn sàng với HTTPS!**
