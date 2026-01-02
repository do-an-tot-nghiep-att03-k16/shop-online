#!/bin/bash

# ============================================
# Script tạo SSH key mới
# ============================================

set -e

echo "🔐 SSH Key Generator"
echo "=========================================="
echo ""

# Màu sắc
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Nhập email
read -p "📧 Nhập email của bạn (để identify key): " email

if [ -z "$email" ]; then
    echo "❌ Email không được để trống!"
    exit 1
fi

# Tên file key
echo ""
echo "📝 Tên file key (mặc định: id_rsa_kamatera):"
read -p "Key name: " keyname
keyname=${keyname:-id_rsa_kamatera}

# Đường dẫn lưu key
ssh_dir="$HOME/.ssh"
key_path="$ssh_dir/$keyname"

# Tạo thư mục .ssh nếu chưa có
mkdir -p "$ssh_dir"
chmod 700 "$ssh_dir"

# Kiểm tra key đã tồn tại chưa
if [ -f "$key_path" ]; then
    echo ""
    echo "⚠️  Key '$keyname' đã tồn tại!"
    read -p "Ghi đè? (y/N): " overwrite
    if [ "$overwrite" != "y" ]; then
        echo "❌ Hủy bỏ."
        exit 1
    fi
fi

echo ""
echo "🔨 Đang tạo SSH key..."
echo ""

# Tạo SSH key
ssh-keygen -t ed25519 -C "$email" -f "$key_path" -N ""

# Set permissions
chmod 600 "$key_path"
chmod 644 "$key_path.pub"

echo ""
echo "=========================================="
echo "✅ SSH Key đã được tạo thành công!"
echo "=========================================="
echo ""
echo "📁 Vị trí:"
echo "   Private key: $key_path"
echo "   Public key:  $key_path.pub"
echo ""
echo "🔑 Public key của bạn:"
echo "=========================================="
cat "$key_path.pub"
echo "=========================================="
echo ""
echo "📋 Copy public key vào clipboard (macOS):"
echo "   pbcopy < $key_path.pub"
echo ""
echo "📋 Copy public key vào clipboard (Linux):"
echo "   cat $key_path.pub | xclip -selection clipboard"
echo "   # hoặc"
echo "   cat $key_path.pub | xsel --clipboard"
echo ""
echo "🚀 Sử dụng key để SSH:"
echo "   ssh -i $key_path user@server-ip"
echo ""
echo "🔧 Thêm vào SSH config (~/.ssh/config):"
echo ""
echo "   Host kamatera"
echo "       HostName YOUR_SERVER_IP"
echo "       User root"
echo "       IdentityFile $key_path"
echo ""
echo "   # Sau đó chỉ cần: ssh kamatera"
echo ""
echo "📤 Upload public key lên server:"
echo "   ssh-copy-id -i $key_path.pub root@YOUR_SERVER_IP"
echo ""
echo "🔐 Để thêm key vào Kamatera:"
echo "   1. Đăng nhập Kamatera Console"
echo "   2. Vào Settings > SSH Keys"
echo "   3. Click 'Add SSH Key'"
echo "   4. Paste public key ở trên"
echo ""
