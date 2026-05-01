# Prism — Dashboard for Hermes Agent

> The open-source web dashboard for [Hermes Agent](https://github.com/NousResearch/hermes-agent) — control your AI assistant beautifully from any browser. **No install required.**

![Stack](https://img.shields.io/badge/React-19-61dafb?logo=react) ![Stack](https://img.shields.io/badge/TanStack_Start-1.x-ff4154) ![Stack](https://img.shields.io/badge/Tailwind_CSS-4.x-38bdf8?logo=tailwindcss) ![Stack](https://img.shields.io/badge/Three.js-r184-black?logo=threedotjs) ![Stack](https://img.shields.io/badge/Providers-17-7c3aed) ![Stack](https://img.shields.io/badge/Platforms-25-10b981) ![Stack](https://img.shields.io/badge/Guardrails-8_rules-ef4444)

---

## ทำไมถึงเลือก Prism?

| ฟีเจอร์ | Hermes Desktop | Virtual Office Buddy |
|---------|:-:|:-:|
| Token & Cost tracking | ✅ | ✅ |
| Slash commands (/web, /image, /code, /usage) | ✅ | ✅ |
| Chat message search | ✅ | ✅ |
| Memory CRUD | ✅ | ✅ |
| 14+ Toolsets | ✅ | ✅ **20 tools** |
| Local LLM (Ollama, LM Studio, vLLM, llama.cpp) | ✅ | ✅ |
| **LLM Providers** | ~5 | ✅ **17 providers** |
| **Platform integrations** | 3 | ✅ **25 platforms** |
| **ใช้งานได้ทันที (web-based)** | ❌ ต้องติดตั้ง | ✅ **ไม่ต้อง install** |
| **3D Office scene** | ❌ | ✅ |
| **Schedules live CRUD** | ❌ | ✅ |

---

## ฟีเจอร์ทั้งหมด

### 💬 Chat ระดับโลก
- **SSE Streaming** — ตอบแบบ real-time พร้อม blinking cursor
- **Token & Cost tracking** — แสดง `~X tokens · $Y` ใต้ทุก reply + session total badge ที่ header
- **7 Slash Commands** — `/clear` `/new` `/help` `/web <query>` `/image <prompt>` `/code <task>` `/usage`
- **Message search** — search bar กรอง message history แบบ real-time
- **Markdown + Syntax Highlight** — code blocks, tables, blockquotes สวยงาม
- **Model Picker inline** — สลับ model ได้ทันทีในหน้า Chat

### 🤖 Models — 17 LLM Providers
| Cloud | Local |
|-------|-------|
| OpenRouter, OpenAI, Anthropic | **Ollama** (port 11434) |
| Google Gemini, Groq, xAI Grok | **LM Studio** (port 1234) |
| Mistral, DeepSeek, Together AI | **vLLM** (port 8000) |
| Fireworks, Cohere, HuggingFace | **llama.cpp** (port 8080) |

- Quick Presets 11 โมเดล (คลิกเดียวเพิ่มได้เลย)
- ทดสอบ connection + วัด latency ต่อ model
- 7 category filter (free, fast, reasoning, code, vision, chat, embedding)

### 🔧 Skills — 20 Toolsets
ทุก skill มี toggle เปิด/ปิดและปุ่ม "ลองใช้ →" ที่ route ไปหน้า Chat พร้อม prompt อัตโนมัติ

| หมวด | Tools |
|------|-------|
| Communication | ส่งอีเมล |
| Calendar | นัดประชุม |
| Research | ค้นหาเว็บ, สรุปข่าว, Web Scraping, สรุปเอกสาร |
| Analytics | สร้างรายงาน, Database Query |
| Productivity | ตรวจสอบงาน, จัดการไฟล์, ตั้งเตือน, Automation Trigger |
| Dev | รัน Terminal, รันโค้ด, Code Review |
| Media | Text-to-Speech, สร้างภาพ |
| Customer | ตอบลูกค้า, E-commerce |
| Memory | Chat History |

### 🧠 Memory — Full CRUD
- เพิ่ม/แก้ไข/ลบ memory entries ได้จริง
- 5 categories: Personal, Preference, Context, Fact, Instruction
- Memory provider selector: **Local** · **Mem0** · **Honcho** · **Local Embeddings**
- Search + filter by category

### 🌐 Platforms — 25 Integrations
Telegram · Discord · Slack · WhatsApp · Signal · Matrix · Mattermost · IRC ·
DingTalk · Feishu · WeCom · WeChat · QQ · Yuanbao ·
Email · SMS · BlueBubbles · Home Assistant · Webhook · Voice · GitHub · Twitter · และอื่นๆ

- ดู env keys ที่ต้องตั้งค่าต่อ platform
- Live status จาก Hermes Agent API

### 📅 Schedules — Live CRUD
- สร้าง/แก้ไข/รัน cron jobs ได้เลย
- Sync กับ Hermes Agent `/api/jobs` แบบ real-time
- Fallback localStorage เมื่อไม่ได้เชื่อมต่อ

### 🏢 Office — 3D Isometric
- Three.js + React Three Fiber
- Isometric office scene แบบ interactive

---

## ติดตั้งและรัน

### ความต้องการของระบบ
- **Node.js** 18+ หรือ **Bun** 1.x
- **Hermes Agent** (แนะนำ) สำหรับฟีเจอร์ real-time ครบชุด

### 1. Clone โปรเจกต์

```bash
git clone https://github.com/sorawittj-hue/virtual-office-buddy.git
cd virtual-office-buddy
```

### 2. ติดตั้ง dependencies

```bash
npm install
# หรือ
bun install
```

### 3. ตั้งค่า environment variables

```bash
cp .env.example .env
```

แก้ไข `.env`:

```env
# LLM via OpenRouter (ฟรีได้ที่ openrouter.ai)
OPENROUTER_API_KEY=sk-or-your-key-here
HERMES_MODEL=nousresearch/hermes-3-llama-3.1-405b:free

# Telegram Bot (ถ้าใช้ WS Bridge mode)
TELEGRAM_BOT_TOKEN=your_bot_token_here
ALLOWED_CHAT_IDS=123456789

# WebSocket Bridge
WS_PORT=18789
WS_SECRET=your-random-secret-key-here
```

> ถ้าเชื่อมผ่าน **Hermes Agent REST API** โดยตรง ไม่ต้องตั้ง `.env` — ตั้งค่าได้ในหน้า **Gateway** แทน

### 4. รัน Dashboard

```bash
npm run dev
```

เปิด `http://localhost:3000`

---

## เชื่อมต่อ Hermes Agent

ตั้งค่าได้ที่หน้า **Gateway** — รองรับ 2 โหมด:

### โหมด A — Hermes Agent REST API (แนะนำ)

1. ติดตั้งและรัน [Hermes Agent](https://github.com/NousResearch/hermes-agent)
2. ตรวจสอบว่า API ทำงานที่ `http://localhost:8642`
3. Gateway → แท็บ "Hermes Agent API" → ใส่ URL → Connect

| Endpoint | ใช้ทำอะไร |
|----------|-----------|
| `GET /health/detailed` | ตรวจสอบสถานะ + platform status |
| `POST /v1/chat/completions` | Chat streaming (SSE) |
| `GET /v1/models` | ดึงรายการ models |
| `GET/POST/PUT/DELETE /api/jobs` | จัดการ scheduled jobs |

### โหมด B — Custom WebSocket Bridge

```bash
npm run telegram   # รัน Telegram WS Bridge
```

Gateway → แท็บ "Custom WS Bridge" → `ws://localhost:18789` → Connect

---

## Local LLM Setup

### Ollama
```bash
ollama pull nous-hermes2
ollama serve
# API พร้อมที่ http://localhost:11434/v1
```

### LM Studio
1. ดาวน์โหลด [LM Studio](https://lmstudio.ai)
2. โหลด model ที่ต้องการ
3. Start Local Server → API พร้อมที่ `http://localhost:1234/v1`

### vLLM
```bash
pip install vllm
vllm serve meta-llama/Llama-3.3-70B-Instruct --port 8000
```

### llama.cpp
```bash
./llama-server -m model.gguf --port 8080
```

จากนั้นไปที่หน้า **Models** → เลือก provider ที่ต้องการ → ใส่ model name → Add

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
