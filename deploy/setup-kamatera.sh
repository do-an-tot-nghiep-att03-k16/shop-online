#!/bin/bash

# ============================================
# Script Setup Kamatera Server
# ============================================

set -e  # Exit on error

echo "🚀 Starting Kamatera Server Setup..."

# ============================================
# 1. Kiểm tra Docker
# ============================================
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# ============================================
# 2. Tạo thư mục deploy
# ============================================
echo "📁 Creating deploy directory structure..."
mkdir -p /root/deploy/env
mkdir -p /root/deploy/nginx/conf.d

# ============================================
# 3. Kiểm tra file cần thiết
# ============================================
if [ ! -f "/root/deploy/docker-compose.yml" ]; then
    echo "❌ File docker-compose.yml không tồn tại!"
    echo "   Vui lòng upload file docker-compose.kamatera.yml lên server và rename thành docker-compose.yml"
    exit 1
fi

if [ ! -f "/root/deploy/env/backend.env" ]; then
    echo "⚠️  File backend.env chưa tồn tại!"
    echo "   Tạo từ template..."
    cp /root/deploy/env/backend.kamatera.env.example /root/deploy/env/backend.env
    echo "   📝 VUI LÒNG CHỈNH SỬA FILE: /root/deploy/env/backend.env"
fi

if [ ! -f "/root/deploy/env/cms.env" ]; then
    echo "⚠️  File cms.env chưa tồn tại!"
    echo "   Tạo từ template..."
    cp /root/deploy/env/cms.kamatera.env.example /root/deploy/env/cms.env
    echo "   📝 VUI LÒNG CHỈNH SỬA FILE: /root/deploy/env/cms.env"
fi

# ============================================
# 4. Generate secrets
# ============================================
echo "🔐 Generating random secrets..."

JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH=$(openssl rand -base64 32)
API_TOKEN_SALT=$(openssl rand -base64 32)
ADMIN_JWT_SECRET=$(openssl rand -base64 32)
TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)
CMS_JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
APP_KEY1=$(openssl rand -base64 32)
APP_KEY2=$(openssl rand -base64 32)
APP_KEY3=$(openssl rand -base64 32)
APP_KEY4=$(openssl rand -base64 32)
CMS_DB_PASSWORD=$(openssl rand -base64 16)
N8N_ENCRYPTION_KEY=$(openssl rand -base64 32)
N8N_DB_PASSWORD=$(openssl rand -base64 16)

echo ""
echo "Generated Secrets:"
echo "=================="
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH=$JWT_REFRESH"
echo "API_TOKEN_SALT=$API_TOKEN_SALT"
echo "ADMIN_JWT_SECRET=$ADMIN_JWT_SECRET"
echo "TRANSFER_TOKEN_SALT=$TRANSFER_TOKEN_SALT"
echo "CMS_JWT_SECRET=$CMS_JWT_SECRET"
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo "APP_KEYS=$APP_KEY1,$APP_KEY2,$APP_KEY3,$APP_KEY4"
echo "CMS_DB_PASSWORD=$CMS_DB_PASSWORD"
echo "N8N_ENCRYPTION_KEY=$N8N_ENCRYPTION_KEY"
echo "N8N_DB_PASSWORD=$N8N_DB_PASSWORD"
echo ""
echo "📝 Copy các secrets này vào file backend.env và cms.env"
echo ""

# ============================================
# 5. Export environment variables
# ============================================
read -p "Nhập GitHub username của bạn: " GITHUB_OWNER
export GITHUB_OWNER=$GITHUB_OWNER
export CMS_DB_PASSWORD=$CMS_DB_PASSWORD
export N8N_ENCRYPTION_KEY=$N8N_ENCRYPTION_KEY
export N8N_DB_PASSWORD=$N8N_DB_PASSWORD

# Lưu vào .bashrc để dùng lâu dài
echo "export GITHUB_OWNER=$GITHUB_OWNER" >> ~/.bashrc
echo "export CMS_DB_PASSWORD=$CMS_DB_PASSWORD" >> ~/.bashrc
echo "export N8N_ENCRYPTION_KEY=$N8N_ENCRYPTION_KEY" >> ~/.bashrc
echo "export N8N_DB_PASSWORD=$N8N_DB_PASSWORD" >> ~/.bashrc

echo "✅ Environment variables đã được set và lưu vào ~/.bashrc"

# ============================================
# 6. Login to GHCR (nếu cần)
# ============================================
read -p "Có phải private repository không? (y/n): " IS_PRIVATE
if [ "$IS_PRIVATE" = "y" ]; then
    echo "🔐 Login to GitHub Container Registry..."
    echo "   Bạn cần GitHub Personal Access Token với quyền read:packages"
    read -p "Nhập GitHub username: " GH_USERNAME
    read -sp "Nhập GitHub Token: " GH_TOKEN
    echo ""
    echo $GH_TOKEN | docker login ghcr.io -u $GH_USERNAME --password-stdin
    echo "✅ Logged in to GHCR"
fi

# ============================================
# 7. Pull và chạy containers
# ============================================
cd /root/deploy

echo "📥 Pulling Docker images..."
docker compose pull

echo "🚀 Starting containers..."
docker compose up -d

echo ""
echo "✅ Setup hoàn tất!"
echo ""
echo "📊 Kiểm tra status:"
echo "   docker compose ps"
echo ""
echo "📝 Xem logs:"
echo "   docker compose logs -f"
echo "   docker logs backend -f"
echo "   docker logs cms -f"
echo ""
echo "⚠️  QUAN TRỌNG: Nhớ chỉnh sửa các file env:"
echo "   - /root/deploy/env/backend.env"
echo "   - /root/deploy/env/cms.env"
echo ""
echo "   Sau khi chỉnh sửa, restart containers:"
echo "   docker compose restart"
