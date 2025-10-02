#!/bin/bash

# Systemd service setup for automatic startup
# This script creates a systemd service to auto-start the voice assistant on boot

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="n8n-voice-assistant"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo "🔧 Setting up systemd service for automatic startup..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  This script needs sudo privileges. Rerunning with sudo..."
    sudo bash "$0" "$@"
    exit $?
fi

# Create systemd service file
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=n8n Voice Assistant for Telegram
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${PROJECT_DIR}
ExecStart=/usr/bin/docker-compose up -d n8n redis
ExecStop=/usr/bin/docker-compose stop n8n redis
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Service file created: $SERVICE_FILE"

# Reload systemd
systemctl daemon-reload

# Enable service
systemctl enable ${SERVICE_NAME}.service

echo ""
echo "✅ Systemd service installed and enabled!"
echo ""
echo "Available commands:"
echo "  sudo systemctl start ${SERVICE_NAME}    # Start service"
echo "  sudo systemctl stop ${SERVICE_NAME}     # Stop service"
echo "  sudo systemctl status ${SERVICE_NAME}   # Check status"
echo "  sudo systemctl disable ${SERVICE_NAME}  # Disable auto-start"
echo ""
echo "The voice assistant will now start automatically on system boot."
