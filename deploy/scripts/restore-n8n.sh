#!/bin/bash
#
# n8n Restore Script - PostgreSQL + Volume Data
# Usage: ./restore-n8n.sh <db_backup.sql.gz> <data_backup.tar.gz>
#
# Example:
# ./restore-n8n.sh ~/backups/n8n/n8n_db_20250101_020000.sql.gz ~/backups/n8n/n8n_data_20250101_020000.tar.gz

set -e

# Check arguments
if [ $# -ne 2 ]; then
  echo "Usage: $0 <db_backup.sql.gz> <data_backup.tar.gz>"
  echo ""
  echo "Example:"
  echo "  $0 ~/backups/n8n/n8n_db_20250101_020000.sql.gz ~/backups/n8n/n8n_data_20250101_020000.tar.gz"
  exit 1
fi

DB_BACKUP="$1"
DATA_BACKUP="$2"

# Validate files
if [ ! -f "$DB_BACKUP" ]; then
  echo "Error: Database backup file not found: $DB_BACKUP"
  exit 1
fi

if [ ! -f "$DATA_BACKUP" ]; then
  echo "Error: Data backup file not found: $DATA_BACKUP"
  exit 1
fi

# Docker container/volume names
POSTGRES_CONTAINER="n8n-postgres"
POSTGRES_USER="n8n"
POSTGRES_DB="n8n"
N8N_VOLUME="n8n_data"

echo "=========================================="
echo "n8n Restore - $(date)"
echo "=========================================="
echo "⚠️  WARNING: This will OVERWRITE existing n8n data!"
echo "Database backup: $DB_BACKUP"
echo "Data backup: $DATA_BACKUP"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

# 1. Stop n8n container
echo "[1/4] Stopping n8n container..."
docker stop n8n || true
echo "✓ n8n stopped"

# 2. Restore PostgreSQL database
echo "[2/4] Restoring PostgreSQL database..."
gunzip -c "$DB_BACKUP" | docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
echo "✓ Database restored"

# 3. Restore n8n data volume
echo "[3/4] Restoring n8n data volume..."
docker run --rm \
  -v "$N8N_VOLUME":/data \
  -v "$(dirname "$DATA_BACKUP")":/backup \
  alpine sh -c "rm -rf /data/* /data/..?* /data/.[!.]* 2>/dev/null; tar xzf /backup/$(basename "$DATA_BACKUP") -C /data"
echo "✓ Data volume restored"

# 4. Start n8n container
echo "[4/4] Starting n8n container..."
docker start n8n
echo "✓ n8n started"

echo "=========================================="
echo "Restore completed successfully!"
echo "n8n should be available shortly."
echo "=========================================="
