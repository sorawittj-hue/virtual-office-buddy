# Virtual Office Buddy

GUI Dashboard สำหรับ [Hermes Agent](https://github.com/NousResearch/hermes-agent) — ควบคุม AI assistant ผ่านหน้าเว็บสวยงาม รองรับ LLM กว่า 13 เจ้า, บอท 25 แพลตฟอร์ม, และการจัดการงานแบบ real-time

![Stack](https://img.shields.io/badge/React-19-61dafb?logo=react) ![Stack](https://img.shields.io/badge/TanStack_Start-1.x-ff4154) ![Stack](https://img.shields.io/badge/Tailwind_CSS-4.x-38bdf8?logo=tailwindcss) ![Stack](https://img.shields.io/badge/Three.js-r184-black?logo=threedotjs)

---

## สิ่งที่ทำได้

| หน้า | ฟีเจอร์ |
|------|---------|
| **Chat** | สนทนากับ Hermes Agent แบบ real-time (SSE streaming), เลือก model ได้ inline |
| **Models** | จัดการ LLM 13 เจ้า, preset 11 โมเดล, ทดสอบ connection + วัด latency |
| **Platforms** | ดู/เปิดใช้ platform บอท 25 แพลตฟอร์ม (Telegram, Discord, Slack ฯลฯ) |
| **Schedules** | สร้าง/แก้ไข/รัน cron jobs — sync กับ Hermes API แบบ live |
| **Gateway** | ตั้งค่าเชื่อมต่อ Hermes Agent REST API หรือ Custom WebSocket Bridge |
| **Agents / Skills / Memory / Tools** | จัดการ agent configs, skills, memory, และ tools |
| **Sessions** | ดู session history |
| **Office** | 3D Isometric office scene (Three.js) |

---

## ความต้องการของระบบ

- **Node.js** 18+ (หรือ [Bun](https://bun.sh) 1.x)
- **Hermes Agent** (แนะนำ) — สำหรับฟีเจอร์ real-time ครบชุด

---

## ติดตั้งและรัน

### 1. Clone โปรเจกต์

```bash
git clone https://github.com/sorawittj-hue/virtual-office-buddy.git
cd virtual-office-buddy
```

### 2. ติดตั้ง dependencies

```bash
npm install
# หรือถ้าใช้ Bun
bun install
```

### 3. ตั้งค่า environment variables

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env` ตามต้องการ:

```env
# Telegram Bot (ถ้าใช้ WS Bridge mode)
TELEGRAM_BOT_TOKEN=your_bot_token_here
ALLOWED_CHAT_IDS=123456789

# WebSocket Bridge
WS_PORT=18789
WS_SECRET=your-random-secret-key-here

# LLM via OpenRouter (แนะนำ — ฟรีได้ที่ openrouter.ai)
OPENROUTER_API_KEY=sk-or-your-key-here
HERMES_MODEL=nousresearch/hermes-3-llama-3.1-405b:free
```

> ถ้าเชื่อมผ่าน **Hermes Agent REST API** (port 8642) ตรงๆ ไม่จำเป็นต้องตั้ง `.env` — ตั้งค่าได้ในหน้า Gateway ของ Dashboard แทน

### 4. รัน Dashboard

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

---

## เชื่อมต่อกับ Hermes Agent

Dashboard รองรับ 2 โหมดการเชื่อมต่อ ตั้งค่าได้ที่หน้า **Gateway**:

### โหมด A — Hermes Agent REST API (แนะนำ)

1. ติดตั้งและรัน [Hermes Agent](https://github.com/NousResearch/hermes-agent)
2. ตรวจสอบว่า API ทำงานที่ `http://localhost:8642`
3. เปิดหน้า **Gateway** → เลือกแท็บ "Hermes Agent API"
4. ใส่ URL `http://localhost:8642` แล้วกด Connect

Endpoints ที่ใช้งาน:

| Endpoint | ใช้ทำอะไร |
|----------|-----------|
| `GET /health/detailed` | ตรวจสอบสถานะ + platform status |
| `POST /v1/chat/completions` | Chat streaming (SSE) |
| `GET /v1/models` | ดึงรายการ models |
| `GET/POST/PUT/DELETE /api/jobs` | จัดการ scheduled jobs |

### โหมด B — Custom WebSocket Bridge

1. คัดลอก `.env.example` เป็น `.env` และแก้ไขค่า
2. รัน bridge:
   ```bash
   npm run telegram
   ```
3. เปิดหน้า **Gateway** → เลือกแท็บ "Custom WS Bridge"
4. ใส่ URL `ws://localhost:18789` และ secret key แล้วกด Connect

---

## LLM Providers ที่รองรับ

| Provider | หมายเหตุ |
|----------|---------|
| OpenRouter | รองรับ model หลากหลาย มี free tier |
| OpenAI | GPT-4o, o1, o3 |
| Anthropic | Claude 3.5 Sonnet, Opus, Haiku |
| Google Gemini | Gemini 2.0 Flash, Pro |
| Groq | Llama 3.3, Mixtral — เร็วมาก |
| xAI | Grok-2 |
| Mistral | Mistral Large, Codestral |
| DeepSeek | DeepSeek-R1, V3 |
| Together AI | Open-source models |
| Fireworks AI | Inference เร็ว |
| Cohere | Command R+ |
| Ollama | Local models (ไม่ต้อง API key) |
| HuggingFace | Inference API |

เพิ่ม/แก้ API key ได้ที่หน้า **Models**

---

## Platform Integrations (25 แพลตฟอร์ม)

Hermes Agent รองรับบอทบน: Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Mattermost, IRC, DingTalk, Feishu, WeCom, WeChat, QQ, Yuanbao, Email, SMS, BlueBubbles, Home Assistant, Webhook, Voice, GitHub, Twitter และอีกหลายแพลตฟอร์ม

ดูรายละเอียด env keys ที่ต้องตั้งได้ที่หน้า **Platforms**

---

## Scripts

```bash
npm run dev        # รัน dev server (Vite)
npm run build      # Build สำหรับ production
npm run preview    # Preview production build
npm run lint       # ตรวจสอบ code style
npm run format     # จัด format ด้วย Prettier
npm run telegram   # รัน Telegram WS Bridge
```

---

## Tech Stack

- **React 19** + **TanStack Start** (SSR framework) + **TanStack Router** (file-based routing)
- **Tailwind CSS v4** + **shadcn/ui** (Radix UI primitives)
- **Three.js** + **React Three Fiber** (3D office scene)
- **Framer Motion** (animations)
- **Vite 7** (build tool)

---

## License

MIT
