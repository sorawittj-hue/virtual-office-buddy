# Prism — Dashboard for Hermes Agent

> The open-source web dashboard for [Hermes Agent](https://github.com/NousResearch/hermes-agent) — control your AI assistant beautifully from any browser. **No install required.**

![Stack](https://img.shields.io/badge/React-19-61dafb?logo=react) ![Stack](https://img.shields.io/badge/TanStack_Start-1.x-ff4154) ![Stack](https://img.shields.io/badge/Tailwind_CSS-4.x-38bdf8?logo=tailwindcss) ![Stack](https://img.shields.io/badge/Three.js-r184-black?logo=threedotjs) ![Stack](https://img.shields.io/badge/Providers-17-7c3aed) ![Stack](https://img.shields.io/badge/Platforms-25-10b981) ![Stack](https://img.shields.io/badge/Guardrails-8_rules-ef4444)

---

## Why Prism?

One agent. Many channels. Full control.

**Prism** refracts your Hermes Agent across 25 platforms and 17 LLM providers — all from a single beautiful web interface with enterprise-grade Guardrails built in.

| Feature                                        | Hermes Desktop |        Prism        |
| ---------------------------------------------- | :------------: | :-----------------: |
| Token & Cost tracking                          |       ✅       |         ✅          |
| Slash commands (/web, /image, /code, /usage)   |       ✅       |         ✅          |
| Chat message search                            |       ✅       |         ✅          |
| Memory CRUD                                    |       ✅       |         ✅          |
| 14+ Toolsets                                   |       ✅       |   ✅ **20 tools**   |
| Local LLM (Ollama, LM Studio, vLLM, llama.cpp) |       ✅       |         ✅          |
| **Built-in Guardrails**                        |       ❌       |   ✅ **8 rules**    |
| **LLM Providers**                              |       ~5       | ✅ **17 providers** |
| **Platform integrations**                      |       3        | ✅ **25 platforms** |
| **Web-based (no install)**                     |       ❌       |         ✅          |
| **3D Office scene**                            |       ❌       |         ✅          |
| **Schedules live CRUD**                        |       ❌       |         ✅          |
| **Workflow Automation (webhooks)**             |       ❌       |         ✅          |

---

## Features

### 💬 Chat

- **SSE Streaming** — real-time responses with blinking cursor
- **Token & Cost tracking** — `~X tokens · $Y` under every reply + session total in header
- **8 Slash Commands** — `/clear` `/new` `/help` `/web` `/image` `/code` `/usage` `/trigger`
- **Message search** — real-time filter across chat history
- **Markdown + Syntax Highlight** — code blocks, tables, blockquotes
- **Inline Model Picker** — switch models without leaving the chat

### 🛡️ Guardrails (client-side, no external API)

| Rule                       | Type   | Action         |
| -------------------------- | ------ | -------------- |
| Prompt Injection           | Input  | **Block**      |
| Jailbreak Detection        | Input  | **Block**      |
| Harmful Content Filter     | Input  | **Block**      |
| PII Input Detection        | Input  | Warn + Confirm |
| Max Message Length         | Input  | Warn           |
| PII Output Detection       | Output | Warn           |
| Toxic Output Filter        | Output | Warn           |
| Session Cost Limit ($0.50) | Cost   | Warn           |

Toggle each rule individually in **Settings → Guardrails**

### 🤖 Models — 17 LLM Providers

| Cloud                          | Local                     |
| ------------------------------ | ------------------------- |
| OpenRouter, OpenAI, Anthropic  | **Ollama** (port 11434)   |
| Google Gemini, Groq, xAI Grok  | **LM Studio** (port 1234) |
| Mistral, DeepSeek, Together AI | **vLLM** (port 8000)      |
| Fireworks, Cohere, HuggingFace | **llama.cpp** (port 8080) |

- 11 quick presets (one-click add)
- Test connection + latency badge per model
- 7 category filters (free, fast, reasoning, code, vision, chat, embedding)

### 🔧 Skills — 20 Toolsets

Every skill has a toggle and a "Try →" button that opens Chat with a prefill prompt.

| Category      | Tools                                                      |
| ------------- | ---------------------------------------------------------- |
| Communication | Email                                                      |
| Calendar      | Meeting scheduler                                          |
| Research      | Web search, News digest, Web scraping, Document summarizer |
| Analytics     | Report builder, Database query                             |
| Productivity  | Task checker, File manager, Reminder, Automation trigger   |
| Dev           | Terminal, Code execution, Code review                      |
| Media         | Text-to-Speech, Image generation                           |
| Customer      | Auto-reply, E-commerce                                     |
| Memory        | Chat history search                                        |

### 🧠 Memory — Full CRUD

- Add / edit / delete memory entries
- 5 categories: Personal, Preference, Context, Fact, Instruction
- Provider selector: **Local** · **Mem0** · **Honcho** · **Local Embeddings**
- Search + filter

### 🌐 Platforms — 25 Integrations

Telegram · Discord · Slack · WhatsApp · Signal · Matrix · Mattermost · IRC ·
DingTalk · Feishu · WeCom · WeChat · QQ · Yuanbao ·
Email · SMS · BlueBubbles · Home Assistant · Webhook · Voice · GitHub · Twitter · and more

- Required env keys reference per platform
- Live status from Hermes Agent API

### ⚡ Workflow Automation — Webhook Integration

Connect Prism to any automation platform (n8n, Zapier, Make, custom endpoints) with a built-in webhook manager.

| Feature           | Details                                               |
| ----------------- | ----------------------------------------------------- |
| HTTP Methods      | GET · POST · PUT · PATCH                              |
| Payload Templates | `{{prompt}}` · `{{timestamp}}` · `{{name}}` variables |
| Slash Command     | `/trigger <name> [prompt]` from Chat                  |
| Response Preview  | Status code · body · latency in Chat                  |
| CRUD              | Add · edit · delete · enable/disable per webhook      |

**Quick start with n8n:**

```
1. Create a Webhook node in n8n → copy URL
2. Tools → Workflow Automation → Add Webhook
3. Paste URL, set method POST, save
4. In Chat: /trigger my-workflow hello world
```

### 📅 Schedules — Live CRUD

- Create / edit / run cron jobs
- Synced with Hermes Agent `/api/jobs` in real-time
- localStorage fallback when offline

### 🏢 Office — 3D Isometric

- Three.js + React Three Fiber
- Interactive isometric office scene

---

## Getting Started

### Requirements

- **Node.js ≥ 22.12.0** — verify with `node -v` (upgrade via [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm))
- **Bun 1.x** (recommended, faster installs) or npm/pnpm
- **Hermes Agent** (recommended) for full real-time features

> **WSL2 / Linux users:** If `node` is not found after install, nvm is not loaded in your shell. Add this to `~/.bashrc` or `~/.zshrc`:
>
> ```bash
> export NVM_DIR="$HOME/.nvm"
> [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
> ```
>
> Then run `source ~/.bashrc` and verify with `node -v`.

### 1. Clone

```bash
git clone https://github.com/sorawittj-hue/virtual-office-buddy.git
cd virtual-office-buddy
```

### 2. Install

```bash
bun install        # recommended — faster, no lockfile conflicts
# or
npm install
```

### 3. Environment variables

```bash
# Local self-hosted (Hermes on same machine):
cp .env.local.example .env

# Full setup (Telegram bridge + OpenRouter):
cp .env.example .env
```

Edit `.env`:

```env
# LLM via OpenRouter (free tier at openrouter.ai)
OPENROUTER_API_KEY=sk-or-your-key-here
HERMES_MODEL=nousresearch/hermes-3-llama-3.1-405b:free

# Telegram Bot (only needed for WS Bridge mode)
TELEGRAM_BOT_TOKEN=your_bot_token_here
ALLOWED_CHAT_IDS=123456789

# WebSocket Bridge
WS_PORT=18789
WS_SECRET=your-random-secret-key-here
```

> Using **Hermes Agent REST API** directly? Skip `.env` — configure the URL in the **Gateway** page instead.

### 4. Run

```bash
npm run dev
```

Open `http://localhost:3000`

---

## Connecting to Hermes Agent

Configure in the **Gateway** page — two modes supported:

### Mode A — Hermes Agent REST API (recommended)

1. Install and run [Hermes Agent](https://github.com/NousResearch/hermes-agent)
2. Verify API is running at `http://localhost:8642`
3. Gateway → "Hermes Agent API" tab → enter URL → Connect

| Endpoint                        | Purpose                |
| ------------------------------- | ---------------------- |
| `GET /health/detailed`          | Status + platform info |
| `POST /v1/chat/completions`     | Chat streaming (SSE)   |
| `GET /v1/models`                | Available models       |
| `GET/POST/PUT/DELETE /api/jobs` | Scheduled jobs         |

### Mode B — Custom WebSocket Bridge

```bash
npm run telegram   # starts Telegram WS Bridge
```

Gateway → "Custom WS Bridge" tab → `ws://localhost:18789` → Connect

---

## Local LLM Setup

### Ollama

```bash
ollama pull nous-hermes2
ollama serve
# Ready at http://localhost:11434/v1
```

### LM Studio

1. Download [LM Studio](https://lmstudio.ai)
2. Load a model
3. Start Local Server → `http://localhost:1234/v1`

### vLLM

```bash
pip install vllm
vllm serve meta-llama/Llama-3.3-70B-Instruct --port 8000
```

### llama.cpp

```bash
./llama-server -m model.gguf --port 8080
```

Then go to **Models** → select provider → enter model name → Add

---

## Deployment — Access from Anywhere

### ☁️ Option A — Cloudflare Workers (Free, Recommended)

Deploy globally in minutes with zero server cost. Prism uses **Cloudflare Workers** (SSR), not static Pages.

```bash
npm install
npm run build
npx wrangler login            # opens browser, sign in to Cloudflare
cd dist/server && npx wrangler deploy
```

You get a URL like `https://prism-dashboard.<your-subdomain>.workers.dev` — open it from any device.

> **Tip:** After deploying, go to **Gateway** in the app and point it to your Hermes Agent URL (needs to be publicly accessible — use [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) to expose it for free).

---

### 💻 Option B — Windows (WSL2) Local

Running inside WSL2 on Windows? WSL2 uses NAT, so `localhost:3000` in Windows browser won't reach the WSL2 process directly.

**One-time port forwarding setup (run in PowerShell as Administrator):**

```powershell
# Forward Windows localhost:3000 → WSL2:3000
$wslIp = (wsl hostname -I).Trim().Split(" ")[0]
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wslIp

# Verify
netsh interface portproxy show v4tov4
```

After this, open `http://localhost:3000` in Windows browser as normal.

> **Note:** WSL2's IP changes on reboot — re-run the command if it stops working. Or use [WSL2 static IP](https://learn.microsoft.com/en-us/windows/wsl/networking) to make it permanent.

---

### 🐳 Option C — Docker on VPS (Self-Hosted)

Run everything on your own server (DigitalOcean, Oracle Cloud free tier, etc.).

**Requirements:** Docker + Docker Compose installed on your VPS.

```bash
git clone https://github.com/sorawittj-hue/virtual-office-buddy.git
cd virtual-office-buddy
cp .env.example .env   # fill in your keys
docker compose up -d   # builds and starts on port 3000
```

Access at `http://YOUR_VPS_IP:3000`

**With a domain + SSL (nginx):**

```bash
# Uncomment the nginx block in docker-compose.yml
# Add your domain config to nginx/prism.conf
# Drop SSL certs in nginx/certs/
docker compose up -d
```

**Update to latest version:**

```bash
git pull
docker compose up -d --build
```

**Run as systemd service (no Docker):**

```bash
sudo cp scripts/prism.service /etc/systemd/system/prism-dashboard.service
# Edit User= and WorkingDirectory= in the file to match your setup
sudo systemctl daemon-reload
sudo systemctl enable --now prism-dashboard
sudo journalctl -u prism-dashboard -f   # view logs
```

---

## Scripts

```bash
npm run dev        # Dev server (Vite)
npm run build      # Production build
npm run preview    # Preview build
npm run lint       # ESLint
npm run format     # Prettier
npm run telegram   # Telegram WS Bridge
```

---

## Troubleshooting

### `vite: not found` or `Cannot find module`

Node version mismatch is the most common cause. Clean and reinstall:

```bash
node -v   # must be ≥ 22.12.0
rm -rf node_modules package-lock.json
bun install   # or: npm install
```

### Docker build hangs / npm install times out

The Docker image now uses **Bun** which is 5–10× faster than npm. If you built before this fix, force a clean rebuild:

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### `ENOTEMPTY` error on Windows/WSL (D: drive)

WSL2 has known file-locking issues with drives mounted at `/mnt/d/`. Fix: clone to your WSL home directory instead:

```bash
cd ~                   # WSL home (~/ = /home/yourname), NOT /mnt/d/
git clone https://github.com/sorawittj-hue/virtual-office-buddy.git
cd virtual-office-buddy
bun install            # or npm install
```

### npm install still slow on slow networks

The `.npmrc` in this repo sets 5 retries and a 5-minute timeout automatically. If npm still fails, switch to Bun:

```bash
npm install -g bun
bun install
```

### Docker build fails / container exits immediately

```bash
# Check logs
docker compose logs prism

# Force clean rebuild
docker compose down
docker compose up -d --build --force-recreate
```

### Hermes Agent not connecting

1. Make sure Hermes is running: `curl http://localhost:9119/health`
2. Go to **Gateway** page → enter the correct URL → Connect
3. If running in Docker, use your host machine's IP instead of `localhost`  
   (e.g. `http://192.168.1.x:9119` or `http://host.docker.internal:9119`)

---

## Tech Stack

- **React 19** + **TanStack Start** (SSR) + **TanStack Router** (file-based routing)
- **Tailwind CSS v4** + **shadcn/ui** (Radix UI)
- **Three.js** + **React Three Fiber** (3D scene)
- **Framer Motion** (animations)
- **Vite 7** + **TypeScript 5.8**

---

## License

MIT
