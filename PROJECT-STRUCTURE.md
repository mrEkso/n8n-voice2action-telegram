# 📁 Project Structure

```
n8n-voice2action-telegram/
│
├── 📄 README.md                          # Primary documentation
├── 📄 QUICK-START.md                     # Quick start in 5 minutes
├── 📄 SETUP-GUIDE.md                     # Detailed installation guide
├── 📄 ARCHITECTURE.md                    # System architecture
├── 📄 FAQ.md                             # Frequently asked questions
├── 📄 CONTRIBUTING.md                    # Contribution guidelines
├── 📄 LICENSE                            # MIT license
├── 📄 PROJECT-STRUCTURE.md               # This file
│
├── 🐳 docker-compose.yml                 # Main Docker configuration
├── 📄 docker-compose.override.yml.example # Customization example
├── 📄 .env.example                       # Environment variable template
├── 📄 .env                               # Your local settings (not committed)
├── 📄 .gitignore                         # Git ignore rules
│
├── 📂 workflows/                         # n8n workflow files
│   ├── telegram-voice-assistant.json     # Primary workflow (v1)
│   └── telegram-voice-assistant-v2.json  # Enhanced workflow (v2)
│
├── 📂 scripts/                           # Management scripts
│   ├── 🔧 install.sh                     # Automated installation
│   ├── 🔧 setup-aliases.sh               # Command aliases
│   ├── 🔧 whisper-control.sh             # Whisper control
│   ├── 🔧 systemd-setup.sh               # Systemd auto-start
│   ├── 💾 backup.sh                      # Backup creation
│   └── 💾 restore.sh                     # Restore from backup
│
├── 📂 temp/                              # Temporary files (not committed)
│   └── (voice files during processing)
│
├── 📂 backups/                           # Backup archives (not committed)
│   └── n8n-backup-YYYYMMDD_HHMMSS.tar.gz
│
└── 📂 .git/                              # Git repository metadata
```

## 📦 Docker Volumes (auto-created)

```
Docker Volumes:
│
├── n8n_data/                             # n8n data
│   ├── database.sqlite                   # n8n database
│   ├── credentials/                      # Encrypted credentials
│   ├── workflows/                        # Workflow files
│   └── settings/                         # n8n settings
│
├── whisper_models/                       # Whisper model cache
│   └── (models downloaded on first use)
│
└── redis_data/                           # Redis data
    └── appendonly.aof                    # Persistent storage
```

## 🔧 Configuration Files

### `.env` (core variables)
```bash
# n8n
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_password
N8N_HOST=localhost
TIMEZONE=Europe/Kiev

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Gemini
GEMINI_API_KEY=your_gemini_key

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret

# Whisper
WHISPER_MODEL=base
```

### `docker-compose.yml` (services)
```yaml
services:
  - n8n          # Workflow engine
  - whisper      # Speech-to-text
  - redis        # Caching (optional)
```

## 📝 Workflow Files

### `telegram-voice-assistant-v2.json`
```
Nodes:
1. Telegram Trigger        - Receives messages
2. Is Voice Message?       - Validates voice input
3. Get Voice File Info     - Retrieves file information
4. Download Voice          - Downloads audio
5. Whisper Transcribe      - Speech recognition
6. Extract Data            - Extracts data
7. Gemini AI               - Intent analysis
8. Parse Intent            - Parses response
9. Route Intent            - Routes execution
10. Send Gmail             - Sends email
11. Create Calendar Event  - Creates calendar event
12. Send Response          - Sends general response
13-15. Confirmation nodes  - Confirmation steps
```

## 🛠️ Scripts

### Installation & Setup
- **install.sh**: Fully automated installation
- **setup-aliases.sh**: Create handy aliases
- **systemd-setup.sh**: Configure systemd auto-start

### Service Management
- **whisper-control.sh**: Control Whisper container
  - `start` - Start
  - `stop` - Stop
  - `restart` - Restart
  - `status` - Status
  - `logs` - Logs

### Backup & Restore
- **backup.sh**: Create backups (n8n data, workflows, configuration)
- **restore.sh**: Restore from backup

## 📚 Documentation

### User-focused
- **README.md**: Project overview, features, commands
- **QUICK-START.md**: Quick start guide
- **SETUP-GUIDE.md**: Detailed installation steps
- **FAQ.md**: Frequently asked questions

### Developer-focused
- **ARCHITECTURE.md**: Detailed system architecture
- **CONTRIBUTING.md**: Contribution guide
- **PROJECT-STRUCTURE.md**: Project structure (this file)

## 🔐 Security-Sensitive Files

### Not committed (see `.gitignore`)
```
.env                    # Secret keys
temp/                   # Temporary files
backups/                # Backup archives
n8n_data/               # n8n data
whisper_models/         # Whisper models
redis_data/             # Redis data
*.log                   # Log files
```

### Templates (committed)
```
.env.example                        # Configuration template
docker-compose.override.yml.example # Customization example
```

## 📊 Component Sizes

```
Docker Images:
├── n8n:latest              ~500 MB
-├── whisper-asr:latest      ~2-4 GB (with models)
└── redis:7-alpine          ~30 MB

Disk Usage:
├── n8n_data/               ~100-500 MB
-├── whisper_models/         ~1-5 GB (depending on model)
-├── redis_data/             ~10-50 MB
-└── backups/                ~50-200 MB (per backup)
```

## 🚀 Команды управления

### Основные (после setup-aliases.sh)
```bash
voice-assistant-start      # Запуск всех сервисов
voice-assistant-stop       # Остановка всех сервисов
voice-assistant-restart    # Перезапуск
voice-assistant-logs       # Просмотр логов

whisper-start             # Запуск Whisper
whisper-stop              # Остановка Whisper
whisper-status            # Статус Whisper
whisper-logs              # Логи Whisper

n8n-start                 # Запуск n8n
n8n-stop                  # Остановка n8n
n8n-restart               # Перезапуск n8n
n8n-logs                  # Логи n8n
```

### Docker Compose (прямые команды)
```bash
docker-compose up -d              # Запуск всех сервисов
docker-compose down               # Остановка и удаление
docker-compose ps                 # Статус контейнеров
docker-compose logs -f            # Логи всех сервисов
docker-compose restart <service>  # Перезапуск сервиса
docker-compose pull               # Обновление образов
```

## 🔄 Жизненный цикл проекта

### Первоначальная установка
```
1. git clone
2. cp .env.example .env
3. Редактирование .env
4. ./scripts/install.sh
5. source ~/.bash_aliases
6. Настройка n8n (http://localhost:5678)
7. Импорт workflow
8. Настройка credentials
9. Активация workflow
10. Тестирование
```

### Ежедневное использование
```
1. voice-assistant-start (если не запущен)
2. Отправка голосовых сообщений боту
3. Мониторинг: docker stats
4. Логи при необходимости: voice-assistant-logs
```

### Обслуживание
```
Еженедельно:
- Проверка логов на ошибки
- Мониторинг использования диска

Ежемесячно:
- Создание бэкапа: ./scripts/backup.sh
- Обновление образов: docker-compose pull
- Очистка старых логов

По необходимости:
- Обновление API ключей
- Изменение конфигурации
- Добавление новых интеграций
```

## 🎯 Точки расширения

### Добавление новых интеграций
```
1. Создайте новые credentials в n8n
2. Добавьте узлы в workflow
3. Обновите intent detection logic
4. Протестируйте
5. Экспортируйте workflow
```

### Кастомизация Whisper
```
1. Скопируйте docker-compose.override.yml.example
2. Переименуйте в docker-compose.override.yml
3. Измените настройки Whisper
4. Перезапустите: voice-assistant-restart
```

### Добавление мониторинга
```
1. Добавьте Prometheus + Grafana в docker-compose
2. Настройте метрики n8n
3. Создайте дашборды
4. Настройте алерты
```

## 📈 Метрики проекта

```
Файлы:
- Документация: 8 файлов
- Скрипты: 6 файлов
- Workflow: 2 файла
- Конфигурация: 4 файла

Строки кода:
- Bash скрипты: ~500 строк
- Workflow JSON: ~400 строк
- Документация: ~2000 строк
- Docker config: ~150 строк

Поддерживаемые функции:
- Распознавание речи: ✅
- AI анализ: ✅
- Email: ✅
- Calendar: ✅
- Автоматизация: ✅
```

---

**Структура актуальна на**: 2025-10-03

Для вопросов и предложений создавайте issues на GitHub.
