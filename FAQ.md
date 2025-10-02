# ❓ Frequently Asked Questions (FAQ)

## 🚀 Installation & Setup

### Q: What is the minimum system configuration required?

**A:** Minimum requirements:
- CPU: 2 cores
- RAM: 4GB (8GB recommended)
- Disk: 5GB of free space
- OS: Linux (Ubuntu 22.04+), Windows with WSL2, or macOS

### Q: Can I run it on Windows?

**A:** Yes, via WSL2 (Windows Subsystem for Linux):
1. Install WSL2: `wsl --install`
2. Install Ubuntu from Microsoft Store
3. Follow the standard installation guide

### Q: Do I need a GPU for Whisper?

**A:** No, the CPU version works fine. A GPU speeds things up but is not required for basic usage.

---

## 🎤 Whisper & Speech Recognition

### Q: Which Whisper model should I choose?

**A:** Depends on your resources:
- **tiny**: For low-end laptops, fastest but lowest accuracy
- **base**: Best balance (recommended)
- **small**: Better quality, higher resource usage
- **medium/large**: For powerful systems

### Q: Whisper uses too much memory, what should I do?

**A:**
1. Use the `tiny` model in `.env`:
   ```bash
   WHISPER_MODEL=tiny
   ```
2. Make sure Whisper is stopped after use:
   ```bash
   whisper-stop
   ```

### Q: Whisper does not recognize my language

**A:** Whisper supports 99+ languages. Make sure that:
- You use `language=auto` (default)
- Audio quality is sufficient
- Try the `small` model or higher for better accuracy

### Q: How can I speed up transcription?

**A:**
1. Use the `tiny` or `base` model
2. Enable GPU support (if you have an NVIDIA GPU)
3. Preload the model: `whisper-start`

---

## 🤖 Gemini & AI

### Q: Gemini API doesn't respond

**A:** Check:
1. API key correctness in `.env`
2. API quotas: [Google AI Studio](https://makersuite.google.com/)
3. Internet connection
4. Logs: `n8n-logs`

### Q: Can I use another LLM instead of Gemini?

**A:** Yes! Update the HTTP Request node to:
- **OpenAI GPT**: `https://api.openai.com/v1/chat/completions`
- **Anthropic Claude**: `https://api.anthropic.com/v1/messages`
- **Local LLM**: Ollama, LM Studio

### Q: How do I improve answer quality?

**A:**
1. Improve the prompt in the "Gemini AI" node
2. Add more context and examples
3. Use a more capable model (e.g., gemini-pro-vision)

---

## 📧 Gmail & Calendar

### Q: OAuth authorization doesn't work

**A:** Check:
1. Client ID and Secret are correct
2. Redirect URI in Google Console: `http://localhost:5678/rest/oauth2-credential/callback`
3. APIs are enabled: Gmail API, Calendar API
4. Test users are added (if the app is in test mode)

### Q: "Access blocked: This app's request is invalid"

**A:**
1. Open Google Cloud Console
2. OAuth consent screen → Edit App
3. Add your email to Test users
4. Ensure scopes are added

### Q: Can I send email from another address?

**A:** Yes, but you need to:
1. Configure "Send mail as" in Gmail
2. Or use SMTP directly in n8n

---

## 🔧 n8n

### Q: I forgot the n8n password

**A:**
1. Stop n8n: `voice-assistant-stop`
2. Change the password in `.env`
3. Start it again: `voice-assistant-start`

### Q: Workflow won't activate

**A:** Check:
1. All credentials are configured (no ⚠️ icons)
2. Telegram webhook is working
3. Logs: `n8n-logs`

### Q: How do I export a workflow?

**A:** In n8n:
1. Open the workflow
2. Menu (three dots) → Download
3. Save the JSON file

### Q: Can I create multiple bots?

**A:** Yes:
1. Create multiple Telegram bots
2. Create separate credentials in n8n
3. Duplicate the workflow for each bot

---

## 🐳 Docker

### Q: Containers won't start

**A:**
```bash
# Check status
docker-compose ps

# View logs
docker-compose logs

# Recreate containers
docker-compose down
docker-compose up -d --force-recreate
```

### Q: Port 5678 is already in use

**A:** Change the port in `docker-compose.yml`:
```yaml
ports:
  - "5679:5678"  # Use 5679 instead of 5678
```

### Q: "Cannot connect to Docker daemon" error

**A:**
```bash
# Check Docker
sudo systemctl status docker

# Start Docker
sudo systemctl start docker

# Add user to group
sudo usermod -aG docker $USER
newgrp docker
```

---

## 🔒 Security

### Q: How do I protect the bot from unauthorized users?

**A:**
1. Add a Chat ID whitelist in the workflow
2. Use a strong password for n8n
3. Do not publish the bot token
4. Use HTTPS for production

### Q: Where are API keys stored?

**A:**
- In the `.env` file (not committed to git)
- In n8n credentials (encrypted in the database)
- Never store them in source code!

### Q: Is it safe for production use?

**A:** For production environments, add:
1. HTTPS (nginx + Let's Encrypt)
2. Firewall rules
3. Rate limiting
4. Backup strategy
5. Monitoring

---

## 📊 Performance

### Q: The system is slow

**A:**
1. Check resources: `docker stats`
2. Use a smaller Whisper model
3. Increase container RAM limits
4. Stop unused containers

### Q: How long does processing take?

**A:** Typical processing time:
- Whisper (base): 2-5 seconds
- Gemini API: 1-3 seconds
- Gmail/Calendar: 1-2 seconds
- **Total**: 5-10 seconds

### Q: Can multiple requests be processed at once?

**A:** Yes, n8n supports parallel executions. Limitations:
- System resources
- API rate limits
- Whisper can process only one request at a time

---

## 🛠️ Troubleshooting

### Q: "Error: ECONNREFUSED" when calling Whisper

**A:**
```bash
# Start Whisper
whisper-start

# Check status
whisper-status

# Check logs
whisper-logs
```

### Q: Bot doesn't respond to messages

**A:** Check:
1. Workflow is activated (green toggle)
2. Telegram credentials are correct
3. Webhook is working: `n8n-logs`
4. Bot is started: send `/start` in Telegram

### Q: "Insufficient quota" from Gemini

**A:**
1. Check quotas: [Google AI Studio](https://makersuite.google.com/)
2. Wait for quota reset (usually daily)
3. Or switch to a paid plan

### Q: How do I view full logs?

**A:**
```bash
# All services
voice-assistant-logs

# Only n8n
n8n-logs

# Only Whisper
whisper-logs

# Specific container
docker logs <container-name>
```

---

## 💡 Advanced Usage

### Q: How do I add new integrations?

**A:**
1. Add new nodes in n8n
2. Configure credentials
3. Connect them to the workflow
4. Update intent detection logic

### Q: Can I add voice responses (TTS)?

**A:** Yes! Add a node that uses:
- Google Text-to-Speech API
- ElevenLabs API
- Local TTS (piper, coqui)

### Q: How do I make the bot multilingual?

**A:**
1. Whisper already supports many languages
2. Gemini understands multiple languages
3. Add language detection in the workflow
4. Adapt prompts for the detected language

### Q: Can I integrate with other messengers?

**A:** Yes! n8n supports:
- WhatsApp (via Twilio)
- Slack
- Discord
- Microsoft Teams
- Signal

---

## 🔄 Updates

### Q: How do I update the system?

**A:**
```bash
voice-assistant-stop
docker-compose pull
voice-assistant-start
```

### Q: How do I roll back to a previous version?

**A:**
```bash
# Use a backup
./scripts/restore.sh backups/n8n-backup-YYYYMMDD_HHMMSS.tar.gz
```

### Q: How do I check component versions?

**A:**
```bash
docker-compose images
docker exec n8n n8n --version
```

---

## 📞 Support

### Q: Where can I get help?

**A:**
- GitHub Issues: for bugs and questions
- Documentation: README.md, SETUP-GUIDE.md
- n8n Community: [community.n8n.io](https://community.n8n.io)
- Telegram: create a support group

### Q: How do I report a bug?

**A:**
1. Check existing issues
2. Create a new issue with:
   - Problem description
   - Steps to reproduce
   - Logs
   - Software versions

### Q: Can I contribute to the project?

**A:** Yes! See [CONTRIBUTING.md](CONTRIBUTING.md)

---

**Didn't find an answer?** Open an issue on GitHub or consult the documentation.
