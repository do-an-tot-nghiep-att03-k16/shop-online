#!/bin/bash

# Verification Script for Kamatera Cloudflare Setup
# Usage: ./verify-setup.sh yourdomain.com

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOMAIN=${1:-}

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Usage: $0 yourdomain.com${NC}"
    exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Domain & SSL Verification Tool      ║${NC}"
echo -e "${BLUE}║   Domain: ${DOMAIN}                    ${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Test counter
PASSED=0
FAILED=0
WARNINGS=0

# Function to print test result
print_result() {
    local status=$1
    local message=$2
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $message"
        ((PASSED++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC}: $message"
        ((FAILED++))
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC}: $message"
        ((WARNINGS++))
    else
        echo -e "${BLUE}ℹ️  INFO${NC}: $message"
    fi
}

# Function to test HTTP response
test_http() {
    local url=$1
    local expected_code=${2:-200}
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" -L "$url" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "$expected_code" ]; then
        return 0
    else
        return 1
    fi
}

# Function to test HTTPS redirect
test_redirect() {
    local url=$1
    
    local location=$(curl -s -I "$url" 2>/dev/null | grep -i "^location:" | awk '{print $2}' | tr -d '\r')
    
    if [[ "$location" == https://* ]]; then
        return 0
    else
        return 1
    fi
}

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. DNS Resolution Tests${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test main domain DNS
if nslookup "$DOMAIN" &>/dev/null; then
    IP=$(nslookup "$DOMAIN" | grep -A1 "Name:" | grep "Address:" | tail -1 | awk '{print $2}')
    print_result "PASS" "Domain $DOMAIN resolves to $IP"
else
    print_result "FAIL" "Domain $DOMAIN does not resolve"
fi

# Test subdomains
for subdomain in www api cms n8n; do
    if nslookup "$subdomain.$DOMAIN" &>/dev/null; then
        IP=$(nslookup "$subdomain.$DOMAIN" | grep -A1 "Name:" | grep "Address:" | tail -1 | awk '{print $2}')
        print_result "PASS" "Subdomain $subdomain.$DOMAIN resolves to $IP"
    else
        print_result "WARN" "Subdomain $subdomain.$DOMAIN does not resolve"
    fi
done

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. HTTPS & SSL Tests${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test HTTPS for main domain
if curl -s -I "https://$DOMAIN" &>/dev/null; then
    print_result "PASS" "HTTPS works for $DOMAIN"
    
    # Check SSL certificate
    if echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | grep -q "Verify return code: 0"; then
        print_result "PASS" "SSL certificate is valid for $DOMAIN"
    else
        print_result "WARN" "SSL certificate verification failed for $DOMAIN"
    fi
else
    print_result "FAIL" "HTTPS does not work for $DOMAIN"
fi

# Test HTTPS for subdomains
for subdomain in www api cms n8n; do
    FULL_DOMAIN="$subdomain.$DOMAIN"
    if curl -s -I "https://$FULL_DOMAIN" &>/dev/null; then
        print_result "PASS" "HTTPS works for $FULL_DOMAIN"
    else
        print_result "WARN" "HTTPS does not work for $FULL_DOMAIN"
    fi
done

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. HTTP to HTTPS Redirect Tests${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test HTTP redirect
for subdomain in "" www api cms n8n; do
    if [ -z "$subdomain" ]; then
        TEST_DOMAIN="$DOMAIN"
    else
        TEST_DOMAIN="$subdomain.$DOMAIN"
    fi
    
    if test_redirect "http://$TEST_DOMAIN"; then
        print_result "PASS" "HTTP → HTTPS redirect works for $TEST_DOMAIN"
    else
        print_result "WARN" "HTTP → HTTPS redirect not working for $TEST_DOMAIN"
    fi
done

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4. Service Availability Tests${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test Frontend
if test_http "https://$DOMAIN" 200 || test_http "https://$DOMAIN" 301 || test_http "https://$DOMAIN" 302; then
    print_result "PASS" "Frontend is accessible at https://$DOMAIN"
else
    print_result "FAIL" "Frontend is not accessible at https://$DOMAIN"
fi

# Test Backend API
if test_http "https://api.$DOMAIN/health" 200 || test_http "https://api.$DOMAIN/" 200; then
    print_result "PASS" "Backend API is accessible at https://api.$DOMAIN"
else
    print_result "WARN" "Backend API health check failed (might need authentication)"
fi

# Test CMS
if test_http "https://cms.$DOMAIN/admin" 200 || test_http "https://cms.$DOMAIN/" 200; then
    print_result "PASS" "CMS is accessible at https://cms.$DOMAIN"
else
    print_result "WARN" "CMS is not accessible (might be loading or need setup)"
fi

# Test N8N
if test_http "https://n8n.$DOMAIN" 200 || test_http "https://n8n.$DOMAIN/" 200; then
    print_result "PASS" "N8N is accessible at https://n8n.$DOMAIN"
else
    print_result "WARN" "N8N is not accessible (might need authentication)"
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}5. Cloudflare Detection${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if domain is using Cloudflare
CF_HEADER=$(curl -s -I "https://$DOMAIN" | grep -i "cf-ray" || echo "")

if [ -n "$CF_HEADER" ]; then
    print_result "PASS" "Domain is proxied through Cloudflare"
    echo -e "   ${BLUE}$CF_HEADER${NC}"
else
    print_result "WARN" "Domain might not be proxied through Cloudflare"
fi

# Check nameservers
NAMESERVERS=$(dig "$DOMAIN" NS +short 2>/dev/null | head -2)
if echo "$NAMESERVERS" | grep -q "cloudflare"; then
    print_result "PASS" "Domain is using Cloudflare nameservers"
    echo "$NAMESERVERS" | while read ns; do
        echo -e "   ${BLUE}→ $ns${NC}"
    done
else
    print_result "WARN" "Domain might not be using Cloudflare nameservers"
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}6. SSL Certificate Details${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Get SSL certificate info
CERT_INFO=$(echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -text 2>/dev/null)

if [ -n "$CERT_INFO" ]; then
    ISSUER=$(echo "$CERT_INFO" | grep "Issuer:" | sed 's/.*Issuer: //')
    VALID_FROM=$(echo "$CERT_INFO" | grep "Not Before:" | sed 's/.*Not Before: //')
    VALID_TO=$(echo "$CERT_INFO" | grep "Not After :" | sed 's/.*Not After : //')
    
    echo -e "${BLUE}Issuer:${NC} $ISSUER"
    echo -e "${BLUE}Valid From:${NC} $VALID_FROM"
    echo -e "${BLUE}Valid To:${NC} $VALID_TO"
    
    if echo "$ISSUER" | grep -qi "cloudflare"; then
        print_result "PASS" "Certificate issued by Cloudflare"
    else
        print_result "INFO" "Certificate issuer: $ISSUER"
    fi
else
    print_result "WARN" "Could not retrieve SSL certificate information"
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}⚠️  There are failed tests. Please check the configuration.${NC}"
    echo -e "   See: deploy/CLOUDFLARE_SETUP_GUIDE.md"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Setup is mostly working but has some warnings.${NC}"
    echo -e "   Some services might need time to start or configuration."
    exit 0
else
    echo -e "${GREEN}✅ All tests passed! Your setup is ready.${NC}"
    echo -e "   You can now proceed with data migration."
    echo -e "   See: deploy/DATA_MIGRATION_GUIDE.md"
    exit 0
fi
