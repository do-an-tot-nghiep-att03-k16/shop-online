#!/bin/bash

# Quick Migration Script for Kamatera Server
# Usage: ./quick-migration.sh [cms|n8n|mongo|all]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration (Edit these)
SERVER_IP="${KAMATERA_SERVER_IP:-your-server-ip}"
CMS_URL="${CMS_URL:-https://cms.yourdomain.com}"
N8N_URL="${N8N_URL:-https://n8n.yourdomain.com}"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Kamatera Server Migration Helper    ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Check if variables are set
if [ "$SERVER_IP" = "your-server-ip" ]; then
    echo -e "${RED}❌ Please set KAMATERA_SERVER_IP environment variable${NC}"
    echo "   Example: export KAMATERA_SERVER_IP=1.2.3.4"
    exit 1
fi

# Function to migrate CMS
migrate_cms() {
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📦 Migrating Strapi CMS${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Check if my-cms exists
    if [ ! -d "my-cms" ]; then
        echo -e "${RED}❌ my-cms directory not found!${NC}"
        return 1
    fi
    
    cd my-cms
    
    echo -e "${BLUE}Step 1: Creating transfer token on server...${NC}"
    echo "Run this command on your server to create a token:"
    echo ""
    echo -e "${YELLOW}ssh root@$SERVER_IP 'docker exec cms npx strapi transfer:token:create --name migration-token'${NC}"
    echo ""
    read -p "Enter the transfer token: " TRANSFER_TOKEN
    
    if [ -z "$TRANSFER_TOKEN" ]; then
        echo -e "${RED}❌ Token is required!${NC}"
        cd ..
        return 1
    fi
    
    echo -e "${BLUE}Step 2: Starting data transfer...${NC}"
    npx strapi transfer \
        --to "$CMS_URL/admin" \
        --to-token "$TRANSFER_TOKEN"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ CMS migration completed successfully!${NC}"
    else
        echo -e "${RED}❌ CMS migration failed!${NC}"
        cd ..
        return 1
    fi
    
    cd ..
}

# Function to migrate N8N
migrate_n8n() {
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🔄 Migrating N8N Workflows${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    echo "N8N Migration Options:"
    echo "  1. Export via UI (Recommended)"
    echo "  2. Database backup (Advanced)"
    echo ""
    read -p "Choose option (1 or 2): " N8N_OPTION
    
    case $N8N_OPTION in
        1)
            echo ""
            echo -e "${BLUE}📋 Manual Steps:${NC}"
            echo "  1. Open local N8N: http://localhost:5678"
            echo "  2. Go to Settings → Import/Export"
            echo "  3. Click 'Export All Workflows'"
            echo "  4. Save the workflows.json file"
            echo ""
            echo "  5. Open server N8N: $N8N_URL"
            echo "  6. Go to Settings → Import/Export"
            echo "  7. Click 'Import from File'"
            echo "  8. Upload the workflows.json file"
            echo ""
            echo -e "${GREEN}✅ Follow the steps above to migrate N8N workflows${NC}"
            ;;
        2)
            echo -e "${BLUE}Creating N8N database backup...${NC}"
            
            # Check if using docker
            if command -v docker &> /dev/null; then
                BACKUP_FILE="backup/n8n-backup-$(date +%Y%m%d-%H%M%S).sql"
                mkdir -p backup
                
                echo "Creating backup..."
                docker exec n8n-postgres pg_dump -U n8n n8n > "$BACKUP_FILE"
                
                if [ $? -eq 0 ]; then
                    echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
                    echo ""
                    echo -e "${BLUE}Upload and restore on server:${NC}"
                    echo ""
                    echo -e "${YELLOW}# Upload backup${NC}"
                    echo "scp $BACKUP_FILE root@$SERVER_IP:/root/deploy/backup/"
                    echo ""
                    echo -e "${YELLOW}# Restore on server${NC}"
                    echo "ssh root@$SERVER_IP << 'EOF'"
                    echo "cd /root/deploy"
                    echo "docker stop n8n"
                    echo "docker exec -i n8n-postgres psql -U n8n -c 'DROP DATABASE IF EXISTS n8n;'"
                    echo "docker exec -i n8n-postgres psql -U n8n -c 'CREATE DATABASE n8n;'"
                    echo "docker exec -i n8n-postgres psql -U n8n n8n < backup/$(basename $BACKUP_FILE)"
                    echo "docker start n8n"
                    echo "EOF"
                    echo ""
                    echo -e "${RED}⚠️  Make sure N8N_ENCRYPTION_KEY is the same on both servers!${NC}"
                else
                    echo -e "${RED}❌ Backup failed!${NC}"
                    return 1
                fi
            else
                echo -e "${RED}❌ Docker not found!${NC}"
                return 1
            fi
            ;;
        *)
            echo -e "${RED}❌ Invalid option${NC}"
            return 1
            ;;
    esac
}

# Function to migrate MongoDB
migrate_mongo() {
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🗄️  Migrating MongoDB${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    echo "Is your server using:"
    echo "  1. MongoDB in Docker"
    echo "  2. MongoDB Atlas (Cloud)"
    echo ""
    read -p "Choose option (1 or 2): " MONGO_OPTION
    
    BACKUP_FILE="backup/mongo-backup-$(date +%Y%m%d-%H%M%S).archive"
    mkdir -p backup
    
    echo -e "${BLUE}Creating MongoDB backup...${NC}"
    
    if command -v docker &> /dev/null; then
        docker exec mongo mongodump --archive=/data/backup.archive --gzip
        docker cp mongo:/data/backup.archive "$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
            echo ""
            
            case $MONGO_OPTION in
                1)
                    echo -e "${BLUE}Upload and restore on server:${NC}"
                    echo ""
                    echo -e "${YELLOW}# Upload backup${NC}"
                    echo "scp $BACKUP_FILE root@$SERVER_IP:/root/deploy/backup/"
                    echo ""
                    echo -e "${YELLOW}# Restore on server${NC}"
                    echo "ssh root@$SERVER_IP << 'EOF'"
                    echo "cd /root/deploy"
                    echo "docker cp backup/$(basename $BACKUP_FILE) mongo:/data/"
                    echo "docker exec mongo mongorestore --archive=/data/$(basename $BACKUP_FILE) --gzip"
                    echo "EOF"
                    ;;
                2)
                    read -p "Enter MongoDB Atlas URI: " ATLAS_URI
                    if [ -n "$ATLAS_URI" ]; then
                        echo -e "${BLUE}Restoring to Atlas...${NC}"
                        mongorestore --uri "$ATLAS_URI" --archive="$BACKUP_FILE" --gzip
                        
                        if [ $? -eq 0 ]; then
                            echo -e "${GREEN}✅ MongoDB restored to Atlas!${NC}"
                        else
                            echo -e "${RED}❌ Restore failed!${NC}"
                            return 1
                        fi
                    fi
                    ;;
            esac
        else
            echo -e "${RED}❌ Backup failed!${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Docker not found!${NC}"
        return 1
    fi
}

# Function to show verification steps
show_verification() {
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Verification Steps${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}1. Check CMS:${NC}"
    echo "   curl -I $CMS_URL"
    echo "   Open: $CMS_URL/admin"
    echo ""
    echo -e "${BLUE}2. Check N8N:${NC}"
    echo "   curl -I $N8N_URL"
    echo "   Open: $N8N_URL"
    echo ""
    echo -e "${BLUE}3. Check Backend:${NC}"
    echo "   ssh root@$SERVER_IP 'docker ps'"
    echo "   ssh root@$SERVER_IP 'docker logs backend --tail 50'"
    echo ""
    echo -e "${BLUE}4. Check Database Connections:${NC}"
    echo "   ssh root@$SERVER_IP 'docker logs cms --tail 20 | grep -i database'"
    echo "   ssh root@$SERVER_IP 'docker logs backend --tail 20 | grep -i mongo'"
    echo ""
}

# Main menu
case "${1:-menu}" in
    cms)
        migrate_cms
        show_verification
        ;;
    n8n)
        migrate_n8n
        show_verification
        ;;
    mongo)
        migrate_mongo
        show_verification
        ;;
    all)
        echo -e "${YELLOW}Starting full migration...${NC}"
        migrate_cms && migrate_n8n && migrate_mongo
        show_verification
        ;;
    menu|*)
        echo "Usage: $0 [cms|n8n|mongo|all]"
        echo ""
        echo "Options:"
        echo "  cms    - Migrate Strapi CMS data"
        echo "  n8n    - Migrate N8N workflows"
        echo "  mongo  - Migrate MongoDB data"
        echo "  all    - Migrate everything"
        echo ""
        echo "Examples:"
        echo "  $0 cms"
        echo "  $0 n8n"
        echo "  $0 all"
        echo ""
        echo "Before running, set environment variables:"
        echo "  export KAMATERA_SERVER_IP=1.2.3.4"
        echo "  export CMS_URL=https://cms.yourdomain.com"
        echo "  export N8N_URL=https://n8n.yourdomain.com"
        ;;
esac

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Done! Check deploy/DATA_MIGRATION_GUIDE.md for details${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
