# Prism — Dashboard for Hermes Agent

> The open-source web dashboard for [Hermes Agent](https://github.com/NousResearch/hermes-agent) — control your AI assistant beautifully from any browser. **No install required.**

![Stack](https://img.shields.io/badge/React-19-61dafb?logo=react) ![Stack](https://img.shields.io/badge/TanStack_Start-1.x-ff4154) ![Stack](https://img.shields.io/badge/Tailwind_CSS-4.x-38bdf8?logo=tailwindcss) ![Stack](https://img.shields.io/badge/Three.js-r184-black?logo=threedotjs) ![Stack](https://img.shields.io/badge/Providers-17-7c3aed) ![Stack](https://img.shields.io/badge/Platforms-25-10b981) ![Stack](https://img.shields.io/badge/Guardrails-8_rules-ef4444)

---

## Why Prism?

One agent. Many channels. Full control.

**Prism** refracts your Hermes Agent across 25 platforms and 17 LLM providers — all from a single beautiful web interface with enterprise-grade Guardrails built in.

| Feature | Hermes Desktop | Prism |
|---------|:-:|:-:|
| Token & Cost tracking | ✅ | ✅ |
| Slash commands (/web, /image, /code, /usage) | ✅ | ✅ |
| Chat message search | ✅ | ✅ |
| Memory CRUD | ✅ | ✅ |
| 14+ Toolsets | ✅ | ✅ **20 tools** |
| Local LLM (Ollama, LM Studio, vLLM, llama.cpp) | ✅ | ✅ |
| **Built-in Guardrails** | ❌ | ✅ **8 rules** |
| **LLM Providers** | ~5 | ✅ **17 providers** |
| **Platform integrations** | 3 | ✅ **25 platforms** |
| **Web-based (no install)** | ❌ | ✅ |
| **3D Office scene** | ❌ | ✅ |
| **Schedules live CRUD** | ❌ | ✅ |
| **Workflow Automation (webhooks)** | ❌ | ✅ |

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

| Rule | Type | Action |
|------|------|--------|
| Prompt Injection | Input | **Block** |
| Jailbreak Detection | Input | **Block** |
| Harmful Content Filter | Input | **Block** |
| PII Input Detection | Input | Warn + Confirm |
| Max Message Length | Input | Warn |
| PII Output Detection | Output | Warn |
| Toxic Output Filter | Output | Warn |
| Session Cost Limit ($0.50) | Cost | Warn |

Toggle each rule individually in **Settings → Guardrails**

### 🤖 Models — 17 LLM Providers

| Cloud | Local |
|-------|-------|
| OpenRouter, OpenAI, Anthropic | **Ollama** (port 11434) |
| Google Gemini, Groq, xAI Grok | **LM Studio** (port 1234) |
| Mistral, DeepSeek, Together AI | **vLLM** (port 8000) |
| Fireworks, Cohere, HuggingFace | **llama.cpp** (port 8080) |

- 11 quick presets (one-click add)
- Test connection + latency badge per model
- 7 category filters (free, fast, reasoning, code, vision, chat, embedding)

### 🔧 Skills — 20 Toolsets
Every skill has a toggle and a "Try →" button that opens Chat with a prefill prompt.

| Category | Tools |
|----------|-------|
| Communication | Email |
| Calendar | Meeting scheduler |
| Research | Web search, News digest, Web scraping, Document summarizer |
| Analytics | Report builder, Database query |
| Productivity | Task checker, File manager, Reminder, Automation trigger |
| Dev | Terminal, Code execution, Code review |
| Media | Text-to-Speech, Image generation |
| Customer | Auto-reply, E-commerce |
| Memory | Chat history search |

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

| Feature | Details |
|---------|---------|
| HTTP Methods | GET · POST · PUT · PATCH |
| Payload Templates | `{{prompt}}` · `{{timestamp}}` · `{{name}}` variables |
| Slash Command | `/trigger <name> [prompt]` from Chat |
| Response Preview | Status code · body · latency in Chat |
| CRUD | Add · edit · delete · enable/disable per webhook |

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
- **Node.js** 18+ or **Bun** 1.x
- **Hermes Agent** (recommended) for full real-time features

### 1. Clone

```bash
git clone https://github.com/sorawittj-hue/virtual-office-buddy.git
cd virtual-office-buddy
```

### 2. Install

```bash
npm install
# or
bun install
```

### 3. Environment variables

```bash
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

| Endpoint | Purpose |
|----------|---------|
| `GET /health/detailed` | Status + platform info |
| `POST /v1/chat/completions` | Chat streaming (SSE) |
| `GET /v1/models` | Available models |
| `GET/POST/PUT/DELETE /api/jobs` | Scheduled jobs |

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

### 🐳 Option B — Docker on VPS (Self-Hosted)

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

## Tech Stack

- **React 19** + **TanStack Start** (SSR) + **TanStack Router** (file-based routing)
- **Tailwind CSS v4** + **shadcn/ui** (Radix UI)
- **Three.js** + **React Three Fiber** (3D scene)
- **Framer Motion** (animations)
- **Vite 7** + **TypeScript 5.8**

---

## License

MIT
