#!/bin/bash
#
# n8n Backup Script - PostgreSQL + Volume Data
# Usage: ./backup-n8n.sh [backup_dir]
#
# Backs up:
# - n8n PostgreSQL database (workflows, credentials, executions)
# - n8n data volume (settings, custom nodes, files)
#
# Schedule with crontab:
# 0 2 * * * /path/to/backup-n8n.sh /path/to/backups >> /var/log/n8n-backup.log 2>&1

set -e

# Configuration
BACKUP_DIR="${1:-$HOME/backups/n8n}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Docker container/volume names
POSTGRES_CONTAINER="n8n-postgres"
POSTGRES_USER="n8n"
POSTGRES_DB="n8n"
N8N_VOLUME="n8n_data"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo "n8n Backup - $(date)"
echo "=========================================="

# 1. Backup PostgreSQL database
echo "[1/3] Backing up PostgreSQL database..."
DB_BACKUP="$BACKUP_DIR/n8n_db_${DATE}.sql.gz"
docker exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$DB_BACKUP"
echo "✓ Database backup: $DB_BACKUP ($(du -h "$DB_BACKUP" | cut -f1))"

# 2. Backup n8n data volume
echo "[2/3] Backing up n8n data volume..."
VOLUME_BACKUP="$BACKUP_DIR/n8n_data_${DATE}.tar.gz"
docker run --rm \
  -v "$N8N_VOLUME":/data \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/n8n_data_${DATE}.tar.gz" -C /data .
echo "✓ Volume backup: $VOLUME_BACKUP ($(du -h "$VOLUME_BACKUP" | cut -f1))"

# 3. Clean up old backups (keep last N days)
echo "[3/3] Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "n8n_*.gz" -mtime +$RETENTION_DAYS -type f -delete
REMAINING=$(find "$BACKUP_DIR" -name "n8n_*.gz" -type f | wc -l)
echo "✓ Kept $REMAINING backup file(s)"

# Summary
echo "=========================================="
echo "Backup completed successfully!"
echo "Location: $BACKUP_DIR"
echo "=========================================="
