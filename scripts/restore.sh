#!/bin/bash

# Restore script for n8n data and configurations

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup-file.tar.gz>"
    echo ""
    echo "Available backups:"
    ls -lh backups/*.tar.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMP_RESTORE="/tmp/n8n-restore-$$"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will replace current configuration and data!"
read -p "Continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled"
    exit 0
fi

echo "📦 Extracting backup..."
mkdir -p "$TEMP_RESTORE"
tar xzf "$BACKUP_FILE" -C "$TEMP_RESTORE"

BACKUP_DIR=$(ls -d ${TEMP_RESTORE}/n8n-backup-* | head -1)

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Invalid backup file"
    rm -rf "$TEMP_RESTORE"
    exit 1
fi

echo "🛑 Stopping services..."
cd "$PROJECT_DIR"
docker-compose down

echo "📋 Restoring configuration files..."
cp "${BACKUP_DIR}/.env" "${PROJECT_DIR}/.env" 2>/dev/null || echo "⚠️  No .env in backup"
cp "${BACKUP_DIR}/docker-compose.yml" "${PROJECT_DIR}/" 2>/dev/null || echo "⚠️  No docker-compose.yml in backup"

echo "📁 Restoring workflows..."
rm -rf "${PROJECT_DIR}/workflows"
cp -r "${BACKUP_DIR}/workflows" "${PROJECT_DIR}/" 2>/dev/null || echo "⚠️  No workflows in backup"

echo "💾 Restoring n8n data..."
if [ -f "${BACKUP_DIR}/n8n_data.tar.gz" ]; then
    docker run --rm \
      -v n8n-voice2action-telegram_n8n_data:/data \
      -v "${BACKUP_DIR}:/backup" \
      alpine sh -c "rm -rf /data/* && tar xzf /backup/n8n_data.tar.gz -C /data"
fi

echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "✅ Restore completed!"
echo "🌐 Access n8n at: http://localhost:5678"
echo ""

# Cleanup
rm -rf "$TEMP_RESTORE"
