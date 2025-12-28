#!/bin/bash
#
# Setup n8n Backup Cron Job
# Usage: sudo ./setup-n8n-backup-cron.sh
#
# This will:
# - Make backup script executable
# - Add daily backup cron job (2 AM)
# - Create log directory

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-n8n.sh"
BACKUP_DIR="$HOME/backups/n8n"
LOG_DIR="/var/log/n8n-backup"
LOG_FILE="$LOG_DIR/backup.log"

echo "=========================================="
echo "n8n Backup Cron Setup"
echo "=========================================="

# 1. Make backup script executable
chmod +x "$BACKUP_SCRIPT"
echo "✓ Made backup script executable"

# 2. Create backup directory
mkdir -p "$BACKUP_DIR"
echo "✓ Created backup directory: $BACKUP_DIR"

# 3. Create log directory
sudo mkdir -p "$LOG_DIR"
sudo chown $USER:$USER "$LOG_DIR"
echo "✓ Created log directory: $LOG_DIR"

# 4. Setup cron job
CRON_JOB="0 2 * * * $BACKUP_SCRIPT $BACKUP_DIR >> $LOG_FILE 2>&1"
CRON_COMMENT="# n8n daily backup at 2 AM"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
  echo "⚠️  Cron job already exists. Skipping..."
else
  # Add cron job
  (crontab -l 2>/dev/null; echo "$CRON_COMMENT"; echo "$CRON_JOB") | crontab -
  echo "✓ Added cron job (daily at 2 AM)"
fi

# 5. Show current crontab
echo ""
echo "Current cron jobs:"
crontab -l | grep -A1 "n8n" || echo "(none)"

echo ""
echo "=========================================="
echo "Setup completed!"
echo "=========================================="
echo "Backup location: $BACKUP_DIR"
echo "Log file: $LOG_FILE"
echo "Schedule: Daily at 2 AM"
echo ""
echo "To test backup now:"
echo "  $BACKUP_SCRIPT $BACKUP_DIR"
echo ""
echo "To view logs:"
echo "  tail -f $LOG_FILE"
echo "=========================================="
