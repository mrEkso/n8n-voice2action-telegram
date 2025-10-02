#!/bin/bash

# Setup convenient aliases for managing the voice assistant

ALIAS_FILE="$HOME/.bash_aliases"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "📝 Setting up aliases for voice assistant management..."

# Create or append to .bash_aliases
cat >> "$ALIAS_FILE" << EOF

# n8n Voice Assistant Aliases
alias n8n-start='cd $PROJECT_DIR && docker-compose up -d n8n redis'
alias n8n-stop='cd $PROJECT_DIR && docker-compose stop n8n redis'
alias n8n-restart='cd $PROJECT_DIR && docker-compose restart n8n'
alias n8n-logs='cd $PROJECT_DIR && docker-compose logs -f n8n'
alias n8n-status='cd $PROJECT_DIR && docker-compose ps'

# Whisper Control Aliases
alias whisper-start='$PROJECT_DIR/scripts/whisper-control.sh start'
alias whisper-stop='$PROJECT_DIR/scripts/whisper-control.sh stop'
alias whisper-status='$PROJECT_DIR/scripts/whisper-control.sh status'
alias whisper-logs='$PROJECT_DIR/scripts/whisper-control.sh logs'

# Combined Management
alias voice-assistant-start='cd $PROJECT_DIR && docker-compose up -d n8n redis && echo "✅ Voice assistant started. Access n8n at http://localhost:5678"'
alias voice-assistant-stop='cd $PROJECT_DIR && docker-compose down && echo "✅ Voice assistant stopped"'
alias voice-assistant-restart='cd $PROJECT_DIR && docker-compose restart'
alias voice-assistant-logs='cd $PROJECT_DIR && docker-compose logs -f'

EOF

echo "✅ Aliases added to $ALIAS_FILE"
echo ""
echo "To activate aliases, run:"
echo "  source ~/.bash_aliases"
echo ""
echo "Or add this to your ~/.bashrc if not already present:"
echo "  if [ -f ~/.bash_aliases ]; then . ~/.bash_aliases; fi"
echo ""
echo "Available commands:"
echo "  voice-assistant-start  - Start n8n and Redis"
echo "  voice-assistant-stop   - Stop all services"
echo "  voice-assistant-logs   - View logs"
echo "  whisper-start          - Start Whisper on-demand"
echo "  whisper-stop           - Stop Whisper"
echo "  n8n-logs               - View n8n logs"
