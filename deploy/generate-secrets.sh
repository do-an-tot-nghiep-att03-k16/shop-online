#!/bin/bash

# ============================================
# Script tự động generate secrets
# ============================================

echo "🔐 Generating random secrets for environment files..."
echo ""
echo "=========================================="
echo "📝 BACKEND SECRETS (backend.env)"
echo "=========================================="
echo ""
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)"
echo ""
echo "=========================================="
echo "📝 CMS SECRETS (cms.env)"
echo "=========================================="
echo ""
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "ADMIN_JWT_SECRET=$(openssl rand -base64 32)"
echo "API_TOKEN_SALT=$(openssl rand -base64 32)"
echo "TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)"
echo ""
echo "APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)"
echo ""
echo "=========================================="
echo "✅ Copy các secrets trên vào file env tương ứng"
echo "=========================================="
echo ""
echo "💡 Tip: Lưu secrets vào password manager (1Password, Bitwarden, etc.)"
echo ""
