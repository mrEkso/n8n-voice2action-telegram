#!/bin/bash

# Installation script for n8n Voice Assistant
# This script sets up the entire system from scratch

set -e

echo "🚀 n8n Voice Assistant Installation Script"
echo "=========================================="
echo ""

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo "⚠️  Warning: This script is designed for Linux (Ubuntu 22.04+)"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for Docker
echo "🔍 Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed. Please log out and log back in for group changes to take effect."
    echo "   Then run this script again."
    exit 0
fi

# Check for Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Installing..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
fi

echo "✅ Prerequisites check passed"
echo ""

# Get project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit .env file and add your API keys:"
    echo "   - TELEGRAM_BOT_TOKEN"
    echo "   - GEMINI_API_KEY"
    echo "   - GOOGLE_OAUTH_CLIENT_ID"
    echo "   - GOOGLE_OAUTH_CLIENT_SECRET"
    echo ""
    read -p "Press Enter after you've configured .env file..." -r
else
    echo "✅ .env file already exists"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p workflows temp
chmod +x scripts/*.sh

# Pull Docker images
echo "📦 Pulling Docker images (this may take a while)..."
docker-compose pull

# Start core services (n8n and Redis)
echo "🚀 Starting core services..."
docker-compose up -d n8n redis

# Wait for n8n to be ready
echo "⏳ Waiting for n8n to be ready..."
for i in {1..60}; do
    if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
        echo "✅ n8n is ready!"
        break
    fi
    sleep 2
done

# Download Whisper models in background
echo "📥 Pre-downloading Whisper models (this runs in background)..."
docker-compose up -d whisper
echo "   Whisper will download the model on first use. Check progress with: docker logs -f whisper-asr"

# Setup aliases
echo "🔧 Setting up command aliases..."
bash scripts/setup-aliases.sh

echo ""
echo "✅ Installation complete!"
echo ""
echo "=========================================="
echo "📋 Next Steps:"
echo "=========================================="
echo ""
echo "1. Activate aliases:"
echo "   source ~/.bash_aliases"
echo ""
echo "2. Access n8n web interface:"
echo "   http://localhost:5678"
echo "   Username: admin"
echo "   Password: (check your .env file)"
echo ""
echo "3. Import the workflow:"
echo "   - Open n8n web interface"
echo "   - Go to Workflows → Import from File"
echo "   - Select: workflows/telegram-voice-assistant.json"
echo ""
echo "4. Configure Telegram Bot:"
echo "   - Talk to @BotFather on Telegram"
echo "   - Create a new bot with /newbot"
echo "   - Copy the token to .env file"
echo "   - Get your chat ID from @userinfobot"
echo ""
echo "5. Configure Google APIs:"
echo "   - Go to: https://console.cloud.google.com/"
echo "   - Enable Gmail API and Google Calendar API"
echo "   - Create OAuth 2.0 credentials"
echo "   - Add credentials to .env file"
echo ""
echo "6. Get Gemini API Key:"
echo "   - Go to: https://makersuite.google.com/app/apikey"
echo "   - Create API key"
echo "   - Add to .env file"
echo ""
echo "7. Restart services after configuration:"
echo "   voice-assistant-restart"
echo ""
echo "=========================================="
echo "📚 Useful Commands:"
echo "=========================================="
echo "  voice-assistant-start  - Start the assistant"
echo "  voice-assistant-stop   - Stop the assistant"
echo "  voice-assistant-logs   - View logs"
echo "  whisper-start          - Start Whisper (on-demand)"
echo "  whisper-stop           - Stop Whisper"
echo "  n8n-logs               - View n8n logs"
echo ""
echo "For more information, see README.md"
echo ""
