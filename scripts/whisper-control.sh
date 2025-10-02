#!/bin/bash

# Whisper Container Control Script
# Manages on-demand starting and stopping of Whisper ASR service

CONTAINER_NAME="whisper-asr"
COMPOSE_FILE="docker-compose.yml"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_DIR" || exit 1

case "$1" in
    start)
        echo "🚀 Starting Whisper ASR service..."
        docker-compose up -d whisper
        
        # Wait for service to be ready
        echo "⏳ Waiting for Whisper to be ready..."
        for i in {1..30}; do
            if docker exec $CONTAINER_NAME curl -s http://localhost:9000/ > /dev/null 2>&1; then
                echo "✅ Whisper ASR is ready!"
                exit 0
            fi
            sleep 2
        done
        echo "⚠️  Whisper started but health check timeout. Check logs: docker logs $CONTAINER_NAME"
        ;;
    
    stop)
        echo "🛑 Stopping Whisper ASR service..."
        docker-compose stop whisper
        echo "✅ Whisper ASR stopped"
        ;;
    
    restart)
        echo "🔄 Restarting Whisper ASR service..."
        docker-compose restart whisper
        echo "✅ Whisper ASR restarted"
        ;;
    
    status)
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            echo "✅ Whisper ASR is running"
            docker stats --no-stream $CONTAINER_NAME
        else
            echo "❌ Whisper ASR is not running"
        fi
        ;;
    
    logs)
        docker logs -f $CONTAINER_NAME
        ;;
    
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start Whisper ASR service"
        echo "  stop    - Stop Whisper ASR service"
        echo "  restart - Restart Whisper ASR service"
        echo "  status  - Check Whisper ASR status"
        echo "  logs    - Show Whisper ASR logs"
        exit 1
        ;;
esac
