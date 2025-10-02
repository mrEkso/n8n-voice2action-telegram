#!/bin/bash

# Backup script for n8n data and configurations

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="n8n-backup-${TIMESTAMP}"

echo "📦 Creating backup: ${BACKUP_NAME}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create temporary backup folder
TEMP_BACKUP="${BACKUP_DIR}/${BACKUP_NAME}"
mkdir -p "$TEMP_BACKUP"

echo "📋 Backing up configuration files..."
cp "${PROJECT_DIR}/.env" "${TEMP_BACKUP}/.env" 2>/dev/null || echo "⚠️  .env not found"
cp "${PROJECT_DIR}/docker-compose.yml" "${TEMP_BACKUP}/"

echo "📁 Backing up workflows..."
cp -r "${PROJECT_DIR}/workflows" "${TEMP_BACKUP}/" 2>/dev/null || echo "⚠️  No workflows found"

echo "💾 Backing up n8n data..."
# Export n8n volume data
docker run --rm \
  -v n8n-voice2action-telegram_n8n_data:/data \
  -v "${TEMP_BACKUP}:/backup" \
  alpine tar czf /backup/n8n_data.tar.gz -C /data . 2>/dev/null || echo "⚠️  Could not backup n8n data"

echo "🗜️  Compressing backup..."
cd "$BACKUP_DIR"
tar czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"

echo ""
echo "✅ Backup completed!"
echo "📍 Location: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo ""
echo "To restore this backup:"
echo "  ./scripts/restore.sh ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo ""

# Keep only last 5 backups
echo "🧹 Cleaning old backups (keeping last 5)..."
cd "$BACKUP_DIR"
ls -t n8n-backup-*.tar.gz | tail -n +6 | xargs -r rm
echo "✅ Cleanup complete"
