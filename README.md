# 🎙️ Telegram Voice2Action Assistant

Smart voice assistant for Telegram using **Node.js + Whisper + Gemini AI**. Minimal resource usage, modular architecture, no Docker containers required.

## 🌟 Features

- **🎤 Speech Recognition**: Whisper (Transformers.js) or direct audio upload to Gemini
- **🤖 AI Analysis**: Google Gemini for intent understanding and response generation
- **📧 Email Integration**: Automatic email sending via Gmail API
- **📅 Calendar**: Create Google Calendar events by voice
- **✅ Confirmations**: Interactive buttons for action confirmation
- **⚡ Minimal Resources**: Runs directly on your system, no Docker overhead
- **🚀 Fast**: Lazy service loading, request queue management
- **🔒 Privacy**: Full control over your data, everything runs locally
- **🏗️ Modular Architecture**: Clean code structure, easily extensible

## 📋 Requirements

- **OS**: Linux (Ubuntu 22.04+), macOS, or **Windows 10/11**
- **RAM**: Minimum 2GB (4GB recommended)
- **CPU**: 2+ cores
- **Disk**: 2GB free space
- **Node.js**: version 18.0.0+
- **FFmpeg**: for audio conversion (optional)

## 🚀 Quick Start

### 1. Install Dependencies

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y build-essential git ffmpeg nodejs npm
```

**macOS:**
```bash
brew install git ffmpeg node
```

**Windows:**
```powershell
# Install Node.js from https://nodejs.org/
# FFmpeg is optional for this project
```

### 2. Clone and Setup

```bash
git clone https://github.com/yourusername/voice2action-telegram.git
cd voice2action-telegram

# Install Node.js dependencies
npm install
```

### 3. Configure Environment

Create `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ALLOWED_USERS=123456789,987654321

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Google OAuth (for Gmail & Calendar)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Audio Processing
AUDIO_PROCESSING_METHOD=gemini  # or 'whisper'

# Whisper Settings (if using whisper method)
WHISPER_MODEL=tiny
WHISPER_LANGUAGE=auto

# User Settings
USER_TIMEZONE=Europe/Berlin
```

**Required API Keys:**

- **Telegram Bot Token**: Get from [@BotFather](https://t.me/BotFather)
- **Gemini API Key**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Google OAuth** (for Gmail/Calendar): [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

### 4. Setup Google OAuth (Optional)

If you want to use Gmail and Calendar features:

```bash
# Run OAuth setup
node scripts/setup-oauth.js
```

Follow the instructions to authorize the app.

### 5. Start the Bot

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

That's it! Send a voice message to your Telegram bot.

## 📱 Telegram Bot Setup

### Creating a Bot

1. Open [@BotFather](https://t.me/BotFather) in Telegram
2. Send command: `/newbot`
3. Follow instructions and get your token
4. Add token to `.env` file as `TELEGRAM_BOT_TOKEN`

### Restricting Access (Optional)

1. Get your user ID from [@userinfobot](https://t.me/userinfobot)
2. Add to `.env` as `TELEGRAM_ALLOWED_USERS=123456789`

## 🔑 Google APIs Setup

### Gmail API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Gmail API**
4. Create **OAuth 2.0 Client ID**:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:5678/rest/oauth2-credential/callback`
5. Copy Client ID and Client Secret to `.env`

### Google Calendar API

1. In the same project enable **Google Calendar API**
2. Use the same OAuth credentials

### Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add to `.env` file

## 🎯 Usage

### Starting the Bot

```bash
npm start

# Or for development with auto-reload:
npm run dev
```

### Bot Commands

- `/start` - Show welcome message
- `/status` - Check system status and resource usage
- `/help` - Get help and examples

### Voice Commands Examples

**📧 Email:**
```
"Send email to john@example.com with subject Meeting and text Confirming attendance"
```

**📅 Calendar:**
```
"Create calendar event team meeting tomorrow at 3 PM"
```

**💬 General:**
```
"What's the weather today?"
"Tell me a joke"
"Explain quantum computing"
```

## 🛠️ Management

### Running the Bot

```bash
# Start bot
npm start

# Development mode (auto-reload)
npm run dev

# Stop bot
Ctrl+C
```

### Logs

Logs are saved to `logs/assistant.log`

```bash
# View logs
tail -f logs/assistant.log

# View last 100 lines
tail -n 100 logs/assistant.log
```

### Resource Optimization

**Whisper Model Selection** (in `.env`):
- `tiny` - Fastest, ~75MB RAM, good for most cases
- `base` - Better quality, ~150MB RAM
- `small` - High quality, ~500MB RAM

**Memory Usage:**
- Bot idle: ~50-100MB
- Processing voice: +75-500MB (depending on model)
- Total: ~150-600MB

## 📊 Resource Monitoring

### Whisper Optimization

You can change Whisper model in `.env`:

```bash
# Fast, lower quality (recommended for laptops)
WHISPER_MODEL=tiny

# Balanced speed and quality (default)
WHISPER_MODEL=base

# Better quality, more resources
WHISPER_MODEL=small
```

## 🔧 Architecture

```
┌─────────────────┐
│  Telegram Bot   │
└────────┬────────┘
         │ Voice Message
         ▼
┌─────────────────────┐
│   node.js Workflow  │
└────────┬────────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌──────────────┐
│ Whisper ASR     │  │ Gemini API   │
│ (on-demand)     │  │ (Cloud)      │
└─────────────────┘  └──────┬───────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
         ┌─────────────┐         ┌─────────────┐
         │ Gmail API   │         │ Calendar API│
         └─────────────┘         └─────────────┘
```

## 🔒 Security

- **Don't commit `.env` file** to git (already in .gitignore)
- **Restrict access** to bot via Chat ID

## 🐛 Troubleshooting

### API Errors

1. Check API keys correctness in `.env`
2. Ensure APIs are enabled in Google Cloud Console
3. Check API quotas

### Out of Memory

```bash
# Use smaller Whisper model
WHISPER_MODEL=tiny
```   

## 📚 External Resources

- [Whisper GitHub](https://github.com/openai/whisper)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss.

## 📄 License

MIT License - see LICENSE file

## 👨‍💻 Author

Created with ❤️ for everyday task automation

## 🆘 Support

If you encounter problems:

1. Check the "Troubleshooting" section
2. View logs: `voice-assistant-logs`
3. Create an issue on GitHub with problem description

---

**Note**: This project is intended for personal use. For production environments, additional security and monitoring configuration is recommended.
