#!/bin/bash

# ============================================
# Script Deploy lên Kamatera Server
# ============================================

set -e

echo "🚀 Starting Kamatera Deployment..."

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Hàm hiển thị thông báo
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Kiểm tra Docker đã cài chưa
if ! command -v docker &> /dev/null; then
    print_warn "Docker chưa được cài đặt. Đang cài đặt..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    print_info "✅ Docker đã được cài đặt"
fi

# Kiểm tra Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_warn "Docker Compose chưa được cài đặt. Đang cài đặt..."
    apt update
    apt install -y docker-compose
    print_info "✅ Docker Compose đã được cài đặt"
fi

# Nhập GitHub username
print_info "Nhập GitHub username của bạn (lowercase):"
read -p "GitHub Username: " GITHUB_OWNER

if [ -z "$GITHUB_OWNER" ]; then
    print_error "GitHub username không được để trống!"
    exit 1
fi

# Export biến môi trường
export GITHUB_OWNER=$(echo "$GITHUB_OWNER" | tr '[:upper:]' '[:lower:]')
print_info "GitHub Owner: $GITHUB_OWNER"

# Kiểm tra file env
if [ ! -f "env/backend.env" ]; then
    print_warn "File env/backend.env chưa tồn tại. Copy từ example..."
    cp env/backend.env.example env/backend.env
    print_warn "⚠️  Vui lòng chỉnh sửa file env/backend.env trước khi tiếp tục!"
    print_info "Nhấn Enter sau khi đã chỉnh sửa xong..."
    read
fi

if [ ! -f "env/cms.env" ]; then
    print_warn "File env/cms.env chưa tồn tại. Copy từ example..."
    cp env/cms.env.example env/cms.env
    print_warn "⚠️  Vui lòng chỉnh sửa file env/cms.env trước khi tiếp tục!"
    print_info "Nhấn Enter sau khi đã chỉnh sửa xong..."
    read
fi

# Hỏi có cần login GitHub Container Registry không
print_info "Images của bạn có phải là private không? (y/n)"
read -p "Login GHCR: " need_login

if [ "$need_login" = "y" ]; then
    print_info "Đang login vào GitHub Container Registry..."
    print_info "Nhập GitHub Personal Access Token (PAT):"
    docker login ghcr.io -u "$GITHUB_OWNER"
fi

# Pull images
print_info "🔄 Đang pull Docker images từ GitHub..."
docker-compose pull

# Stop containers cũ (nếu có)
if [ "$(docker ps -q)" ]; then
    print_info "⏸️  Đang dừng containers cũ..."
    docker-compose down
fi

# Start containers
print_info "▶️  Đang start containers..."
docker-compose up -d

# Đợi containers khởi động
print_info "⏳ Đợi containers khởi động (30s)..."
sleep 30

# Kiểm tra trạng thái
print_info "📊 Trạng thái containers:"
docker-compose ps

# Kiểm tra logs
print_info "📝 Logs gần đây:"
docker-compose logs --tail=50

# Hiển thị thông tin truy cập
print_info "
============================================
✅ DEPLOYMENT HOÀN TẤT!
============================================

🌐 Truy cập ứng dụng:
   - Frontend: http://$(curl -s ifconfig.me)
   - Backend API: http://$(curl -s ifconfig.me)/api
   - CMS: http://$(curl -s ifconfig.me)/admin
   - N8N: http://$(curl -s ifconfig.me):5678

📊 Các lệnh hữu ích:
   - Xem logs: docker-compose logs -f [service]
   - Restart: docker-compose restart [service]
   - Stop: docker-compose down
   - Update: docker-compose pull && docker-compose up -d

⚠️  LƯU Ý: 
   - Cấu hình domain và SSL trong nginx/conf.d/default.conf
   - Kiểm tra firewall và mở các port cần thiết
   - Backup dữ liệu thường xuyên
"
