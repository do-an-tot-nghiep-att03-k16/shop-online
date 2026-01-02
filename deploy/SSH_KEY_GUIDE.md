# 🔐 Hướng dẫn tạo và sử dụng SSH Key

## 📋 Tổng quan

SSH key giúp bạn:
- ✅ Đăng nhập server không cần password
- ✅ An toàn hơn password
- ✅ Tự động hóa deployment
- ✅ Quản lý nhiều server dễ dàng

---

## 🚀 Cách 1: Dùng script tự động (FASTEST)

```bash
cd /opt/clothing-shop/deploy

# Chạy script
chmod +x create-ssh-key.sh
./create-ssh-key.sh
```

Script sẽ hỏi:
1. Email của bạn (để identify)
2. Tên key (mặc định: `id_rsa_kamatera`)

Sau đó tự động:
- ✅ Tạo SSH key pair (public + private)
- ✅ Set permissions đúng
- ✅ Hiển thị public key để copy

---

## 🔧 Cách 2: Tạo thủ công

### Bước 1: Tạo key

```bash
# ED25519 (recommended - modern, secure, fast)
ssh-keygen -t ed25519 -C "your-email@example.com"

# RSA (traditional - compatible với hệ thống cũ)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
```

**Hỏi đáp khi tạo:**
```
Enter file in which to save the key: /root/.ssh/id_ed25519
# Nhấn Enter hoặc đặt tên khác: /root/.ssh/id_rsa_kamatera

Enter passphrase (empty for no passphrase):
# Nhấn Enter (không dùng passphrase) hoặc nhập password bảo vệ key
```

### Bước 2: Kiểm tra key đã tạo

```bash
ls -la ~/.ssh/

# Output:
# -rw-------  1 user user  464 Dec 31 id_ed25519      (private key)
# -rw-r--r--  1 user user  103 Dec 31 id_ed25519.pub  (public key)
```

### Bước 3: Xem public key

```bash
cat ~/.ssh/id_ed25519.pub

# Output:
# ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGx... your-email@example.com
```

---

## 📤 Cách thêm SSH key vào Kamatera Server

### Method 1: ssh-copy-id (EASIEST)

```bash
# Copy public key lên server
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@YOUR_SERVER_IP

# Nhập password lần cuối cùng
# Sau đó có thể SSH không cần password:
ssh root@YOUR_SERVER_IP
```

### Method 2: Manual copy

```bash
# 1. Copy public key vào clipboard
cat ~/.ssh/id_ed25519.pub

# 2. SSH vào server (dùng password)
ssh root@YOUR_SERVER_IP

# 3. Thêm public key vào authorized_keys
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys

# 4. Paste public key vào file, save và exit

# 5. Set permissions
chmod 600 ~/.ssh/authorized_keys

# 6. Logout và test
exit
ssh root@YOUR_SERVER_IP  # Không cần password nữa!
```

### Method 3: Thêm khi tạo server trên Kamatera Console

1. Đăng nhập [Kamatera Console](https://console.kamatera.com)
2. Khi tạo server mới, có option "SSH Keys"
3. Click "Add New SSH Key"
4. Paste public key vào
5. Server sẽ tự động có key này khi khởi tạo

---

## 🔧 Cấu hình SSH config (RECOMMENDED)

Tạo file `~/.ssh/config` để dễ quản lý:

```bash
nano ~/.ssh/config
```

**Nội dung:**

```
# Kamatera Production Server
Host kamatera-prod
    HostName 123.456.789.10
    User root
    IdentityFile ~/.ssh/id_rsa_kamatera
    ServerAliveInterval 60
    ServerAliveCountMax 3

# Kamatera Staging Server
Host kamatera-staging
    HostName 123.456.789.20
    User root
    IdentityFile ~/.ssh/id_rsa_kamatera
    ServerAliveInterval 60

# GitHub
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
```

**Sau đó SSH đơn giản:**
```bash
# Thay vì: ssh root@123.456.789.10
ssh kamatera-prod

# Copy file
scp file.txt kamatera-prod:/opt/

# Rsync
rsync -avz ./deploy/ kamatera-prod:/opt/clothing-shop/deploy/
```

---

## 🔐 Best Practices

### 1. **Permissions đúng** (QUAN TRỌNG!)

```bash
# Private key PHẢI là 600 (chỉ owner đọc/ghi)
chmod 600 ~/.ssh/id_ed25519

# Public key có thể 644
chmod 644 ~/.ssh/id_ed25519.pub

# Thư mục .ssh phải 700
chmod 700 ~/.ssh

# authorized_keys phải 600
chmod 600 ~/.ssh/authorized_keys
```

**Nếu permissions sai → SSH sẽ từ chối dùng key!**

### 2. **Dùng Key Type hiện đại**

```bash
# ✅ RECOMMENDED: ED25519 (fast, secure, modern)
ssh-keygen -t ed25519

# ⚠️ OK: RSA 4096 (traditional, compatible)
ssh-keygen -t rsa -b 4096

# ❌ AVOID: RSA 2048 or lower (outdated)
```

### 3. **Một key cho mỗi mục đích**

```
~/.ssh/
├── id_ed25519           # GitHub, GitLab
├── id_ed25519.pub
├── id_rsa_kamatera      # Kamatera servers
├── id_rsa_kamatera.pub
├── id_rsa_aws           # AWS servers
└── id_rsa_aws.pub
```

### 4. **Backup keys an toàn**

```bash
# Backup private keys (ENCRYPTED!)
tar czf ssh-keys-backup.tar.gz ~/.ssh/id_*
gpg -c ssh-keys-backup.tar.gz

# Lưu file ssh-keys-backup.tar.gz.gpg vào:
# - USB drive
# - Password manager (1Password, Bitwarden)
# - Encrypted cloud storage
```

### 5. **Rotate keys định kỳ**

Tạo key mới mỗi 6-12 tháng hoặc khi:
- Nhân viên rời công ty
- Laptop/máy tính bị mất
- Nghi ngờ key bị lộ

---

## 🐛 Troubleshooting

### 1. Permission denied (publickey)

```bash
# Check permissions
ls -la ~/.ssh/

# Fix permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub

# Test với verbose mode
ssh -v root@YOUR_SERVER_IP
```

### 2. Key không được accept

```bash
# Kiểm tra key đã add vào server chưa
ssh root@YOUR_SERVER_IP "cat ~/.ssh/authorized_keys"

# Thử add lại
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@YOUR_SERVER_IP
```

### 3. Too many authentication failures

```bash
# SSH thử tất cả keys → bị server từ chối
# Fix: Chỉ định key cụ thể
ssh -i ~/.ssh/id_rsa_kamatera root@YOUR_SERVER_IP

# Hoặc dùng SSH config
```

### 4. Agent không nhận key

```bash
# Start SSH agent
eval "$(ssh-agent -s)"

# Add key vào agent
ssh-add ~/.ssh/id_ed25519

# List keys trong agent
ssh-add -l
```

---

## 🔒 Bảo mật nâng cao

### 1. Disable password authentication trên server

```bash
# SSH vào server
ssh root@YOUR_SERVER_IP

# Edit SSH config
nano /etc/ssh/sshd_config

# Thay đổi:
PasswordAuthentication no
PubkeyAuthentication yes
PermitRootLogin prohibit-password

# Restart SSH service
systemctl restart sshd

# ⚠️ ĐẢM BẢO SSH key hoạt động trước khi disable password!
```

### 2. Dùng passphrase cho private key

```bash
# Tạo key với passphrase
ssh-keygen -t ed25519 -C "your-email@example.com"
# Nhập passphrase khi được hỏi

# Thêm passphrase cho key hiện có
ssh-keygen -p -f ~/.ssh/id_ed25519
```

### 3. Restrict key usage (trên server)

Edit `~/.ssh/authorized_keys`:

```bash
# Chỉ cho phép từ IP cụ thể
from="123.456.789.0/24" ssh-ed25519 AAAAC3...

# Chỉ cho phép command cụ thể
command="/usr/local/bin/deploy.sh" ssh-ed25519 AAAAC3...

# Disable port forwarding
no-port-forwarding,no-X11-forwarding,no-agent-forwarding ssh-ed25519 AAAAC3...
```

---

## 📝 Quick Reference

```bash
# Tạo key mới
ssh-keygen -t ed25519 -C "email@example.com"

# Xem public key
cat ~/.ssh/id_ed25519.pub

# Copy key lên server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server

# SSH với key cụ thể
ssh -i ~/.ssh/id_ed25519 user@server

# Test SSH connection
ssh -vT git@github.com

# List keys trong SSH agent
ssh-add -l

# Add key vào agent
ssh-add ~/.ssh/id_ed25519

# Remove all keys from agent
ssh-add -D
```

---

## 📞 Resources

- **SSH Key Gen**: https://www.ssh.com/academy/ssh/keygen
- **GitHub SSH**: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
- **SSH Config**: https://www.ssh.com/academy/ssh/config

---

**Chúc bạn cấu hình SSH thành công! 🎉**
