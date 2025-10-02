# 📝 Command Cheatsheet

Quick reference for all system management commands.

## 🚀 Main Commands

```bash
# Start entire system
voice-assistant-start

# Stop entire system
voice-assistant-stop

# Restart
voice-assistant-restart

# View logs (follow in real-time)
voice-assistant-logs

# Status of all containers
docker-compose ps
```

## 🎤 Whisper Management

```bash
# Start Whisper
whisper-start

# Stop Whisper
whisper-stop

# Restart Whisper
whisper-restart

# Whisper status
whisper-status

# Whisper logs
whisper-logs
```

## 🔧 n8n Management

```bash
# Start n8n only
n8n-start

# Stop n8n
n8n-stop

# Restart n8n
n8n-restart

# n8n logs
n8n-logs

# n8n status
n8n-status
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart <service-name>

# Logs of all services
docker-compose logs -f

# Logs of specific service
docker-compose logs -f <service-name>

# Container status
docker-compose ps

# Recreate containers
docker-compose up -d --force-recreate

# Update images
docker-compose pull

# Remove all (including volumes)
docker-compose down -v
```

## 📊 Monitoring

```bash
# Resource usage in real-time
docker stats

# Disk usage
docker system df

# Logs of specific container
docker logs <container-name>

# Last 100 lines of logs
docker logs --tail 100 <container-name>

# Follow logs
docker logs -f <container-name>
```

## 💾 Backup and Restore

```bash
# Create backup
./scripts/backup.sh

# Restore from backup
./scripts/restore.sh backups/n8n-backup-YYYYMMDD_HHMMSS.tar.gz

# List backups
ls -lh backups/
```

## 🔧 Configuration

```bash
# Edit environment variables
nano .env

# Edit docker-compose
nano docker-compose.yml

# Apply changes (restart)
voice-assistant-restart
```

## 🔍 Diagnostics

```bash
# Check Docker status
sudo systemctl status docker

# Check versions
docker --version
docker-compose --version

# Check network
docker network ls
docker network inspect n8n-voice2action-telegram_n8n-network

# Check volumes
docker volume ls
docker volume inspect n8n-voice2action-telegram_n8n_data

# Enter container
docker exec -it n8n bash
docker exec -it whisper-asr bash

# Check ports
sudo netstat -tulpn | grep 5678
sudo netstat -tulpn | grep 9000
```

## 🧹 Cleanup

```bash
# Remove unused images
docker image prune

# Remove unused containers
docker container prune

# Remove unused volumes
docker volume prune

# Full cleanup (careful!)
docker system prune -a

# Cleanup with volume removal
docker system prune -a --volumes
```

## 🔄 Update

```bash
# Stop system
voice-assistant-stop

# Update images
docker-compose pull

# Start with new images
voice-assistant-start

# Check versions
docker-compose images
```

## 🌐 Service Access

```bash
# n8n Web UI
http://localhost:5678

# Whisper API (when running)
http://localhost:9000

# Redis (if used)
redis-cli -h localhost -p 6379
```

## 📱 Telegram Bot

```bash
# Get bot information
curl https://api.telegram.org/bot<TOKEN>/getMe

# Get updates
curl https://api.telegram.org/bot<TOKEN>/getUpdates

# Set webhook
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -d "url=https://your-domain.com/webhook/telegram"

# Delete webhook
curl -X POST https://api.telegram.org/bot<TOKEN>/deleteWebhook
```

## 🔐 Security

```bash
# Change n8n password
nano .env
# Change N8N_BASIC_AUTH_PASSWORD
voice-assistant-restart

# Check open ports
sudo ss -tulpn

# Configure firewall (UFW)
sudo ufw allow 5678/tcp
sudo ufw enable
```

## 📈 Performance

```bash
# Change Whisper model
nano .env
# Set WHISPER_MODEL=tiny (faster) or small (better quality)
voice-assistant-restart

# Limit container memory
# Edit docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       memory: 1G
```

## 🆘 Emergency Recovery

```bash
# Full stop
docker-compose down

# Remove all containers and volumes
docker-compose down -v

# Restore from backup
./scripts/restore.sh backups/latest-backup.tar.gz

# Restart
voice-assistant-start
```

## 📝 Useful Aliases (add to ~/.bashrc)

```bash
# Quick project access
alias va='cd ~/n8n-voice2action-telegram'

# Quick logs
alias valogs='cd ~/n8n-voice2action-telegram && docker-compose logs -f'

# Quick status
alias vastatus='cd ~/n8n-voice2action-telegram && docker-compose ps'

# Quick restart
alias varestart='cd ~/n8n-voice2action-telegram && voice-assistant-restart'
```

## 🔗 Quick Links

- **n8n**: http://localhost:5678
- **Documentation**: [README.md](README.md)
- **FAQ**: [FAQ.md](FAQ.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 💡 Tips

### First Run
```bash
./scripts/install.sh
source ~/.bash_aliases
```

### Daily Usage
```bash
voice-assistant-start  # Morning
voice-assistant-logs   # When issues occur
voice-assistant-stop   # Evening (optional)
```

### Weekly Maintenance
```bash
./scripts/backup.sh           # Backup
docker system prune           # Cleanup
docker-compose pull           # Update
```

### When Problems Occur
```bash
voice-assistant-logs          # Check logs
docker-compose ps             # Check status
voice-assistant-restart       # Restart
```

---

**Tip**: Print this cheatsheet or keep it open in a separate tab!
