/**
 * Hermes Telegram Bridge
 *
 * รัน: node --env-file=.env telegram-bridge.js
 *
 * สิ่งที่ทำ:
 *  1. เปิด WebSocket server (port 18789) รอ Web App เชื่อมต่อ
 *  2. รับคำสั่งจาก Telegram bot (polling)
 *  3. ส่ง real-time events ไปที่ Web App ทุก step
 *  4. ส่งผลลัพธ์กลับ Telegram
 *
 * ความปลอดภัย:
 *  - ALLOWED_CHAT_IDS  จำกัด Telegram user ที่อนุญาต
 *  - WS_SECRET         ยืนยันตัวตน WebSocket client (?token=...)
 *  - Rate limiting     จำกัด RATE_LIMIT_PER_MIN คำสั่ง/นาที ต่อ chat
 *
 * AI จริง (optional):
 *  - ถ้าตั้ง ANTHROPIC_API_KEY จะใช้ Claude วางแผนและตอบ
 *  - ถ้าไม่ตั้ง ใช้ hardcoded fallback plans
 */

import TelegramBot from "node-telegram-bot-api";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";

// ─── Config ────────────────────────────────────────────────────────────────

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WS_PORT = Number(process.env.WS_PORT ?? 18789);
const WS_SECRET = process.env.WS_SECRET ?? "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const RATE_LIMIT_PER_MIN = Number(process.env.RATE_LIMIT_PER_MIN ?? 5);

// Allowed Telegram chat IDs (comma-separated). Empty = allow all — DEV ONLY
const ALLOWED_CHAT_IDS = process.env.ALLOWED_CHAT_IDS
  ? new Set(process.env.ALLOWED_CHAT_IDS.split(",").map((s) => s.trim()))
  : null;

if (!TOKEN) {
  console.error("❌ ไม่พบ TELEGRAM_BOT_TOKEN ใน .env");
  process.exit(1);
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

if (!WS_SECRET) {
  log("⚠️  WS_SECRET ไม่ได้ตั้งค่า — WebSocket จะไม่มีการยืนยันตัวตน (ไม่ปลอดภัยใน production)");
}
if (!ALLOWED_CHAT_IDS) {
  log("⚠️  ALLOWED_CHAT_IDS ไม่ได้ตั้งค่า — Bot รับคำสั่งจากทุก Telegram user (ไม่ปลอดภัยใน production)");
}

// ─── Anthropic AI (optional) ───────────────────────────────────────────────

let anthropic = null;
if (ANTHROPIC_API_KEY) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  log("🤖 Claude AI พร้อมแล้ว (claude-sonnet-4-6)");
}

// ─── Rate limiting ─────────────────────────────────────────────────────────

const rateLimits = new Map(); // chatId -> { count, resetAt }

function checkRateLimit(chatId) {
  const now = Date.now();
  const key = String(chatId);
  let limit = rateLimits.get(key) ?? { count: 0, resetAt: now + 60_000 };
  if (now > limit.resetAt) limit = { count: 0, resetAt: now + 60_000 };
  if (limit.count >= RATE_LIMIT_PER_MIN) return false;
  limit.count++;
  rateLimits.set(key, limit);
  return true;
}

// ─── WebSocket server ───────────────────────────────────────────────────────

const wss = new WebSocketServer({ host: "0.0.0.0", port: WS_PORT });
const clients = new Set();

wss.on("connection", (ws, req) => {
  // Auth check — reject if WS_SECRET is set and token doesn't match
  if (WS_SECRET) {
    const params = new URL(req.url ?? "/", "http://localhost").searchParams;
    if (params.get("token") !== WS_SECRET) {
      ws.close(4001, "Unauthorized");
      log(`🚫 WebSocket: ปฏิเสธการเชื่อมต่อ (token ไม่ถูกต้อง) จาก ${req.socket.remoteAddress}`);
      return;
    }
  }

  clients.add(ws);
  log(`🔌 Web App เชื่อมต่อแล้ว (${clients.size} clients) จาก ${req.socket.remoteAddress}`);
  broadcast({ type: "status", status: "idle", message: "พร้อมรับงานครับ ☕" });

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "ping") ws.send(JSON.stringify({ type: "pong", ts: Date.now() }));
    } catch {}
  });

  ws.on("close", () => {
    clients.delete(ws);
    log(`🔌 Web App ตัดการเชื่อมต่อ (เหลือ ${clients.size} clients)`);
  });
});

function broadcast(event) {
  const json = JSON.stringify(event);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(json);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── AI Plan generation ─────────────────────────────────────────────────────

const AI_SYSTEM_PROMPT = `คุณคือ Hermes ผู้ช่วย AI ออฟฟิศที่ฉลาดและทำงานเก่ง
เมื่อได้รับคำสั่งงาน ให้วางแผนขั้นตอนดำเนินการและตอบในรูปแบบ JSON เท่านั้น (ไม่มีข้อความอื่นนอกจาก JSON)

รูปแบบ JSON ที่ต้องตอบ:
{
  "steps": [
    {"label": "ชื่อขั้นตอนสั้นๆ", "detail": "รายละเอียดเพิ่มเติมหรือ null", "duration": 800},
    {"label": "ขั้นตอนที่ 2", "detail": null, "duration": 600}
  ],
  "result": "สรุปผลลัพธ์ที่น่าพอใจ พร้อม emoji เหมาะสม"
}

กฎ:
- steps: 3-5 ขั้นตอน สมเหตุสมผลกับงานที่ได้รับ
- duration: 400-1200 ms (สมเหตุสมผลตามความยาก)
- ใช้ภาษาไทย
- result: ประโยคเดียว กระชับ บอกว่าทำอะไรเสร็จ`;

async function getAIPlan(command) {
  if (!anthropic) return null;
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: [{ type: "text", text: AI_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `งาน: ${command}` }],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    log(`⚠️  AI plan ล้มเหลว: ${err.message} — ใช้ fallback`);
    return null;
  }
}

// ─── Fallback command plans ────────────────────────────────────────────────

const commandPlans = {
  "ส่งอีเมล": {
    steps: [
      { label: "วิเคราะห์ผู้รับและจุดประสงค์", detail: null, duration: 600 },
      { label: "ร่างเนื้อหาอีเมล", detail: "ใช้น้ำเสียงเป็นกันเอง", duration: 900 },
      { label: "ตรวจทานคำผิด", detail: null, duration: 500 },
      { label: "ส่งผ่าน SMTP", detail: "ไปยัง inbox@example.com", duration: 700 },
    ],
    result: "ส่งอีเมลเรียบร้อย! 📬 ร่าง ตรวจทาน และจัดส่งครบถ้วน",
  },
  "ค้นหาข้อมูล": {
    steps: [
      { label: "เชื่อมต่อแหล่งข้อมูล", detail: null, duration: 500 },
      { label: "กำลังค้นหา", detail: "สแกน 3 ดัชนี", duration: 800 },
      { label: "จัดอันดับผลลัพธ์ 12 รายการ", detail: null, duration: 600 },
      { label: "สรุปสิ่งที่พบ", detail: null, duration: 700 },
    ],
    result: "พบข้อมูลที่เกี่ยวข้อง 12 รายการ และสรุปให้เรียบร้อยแล้ว",
  },
  "นัดประชุม": {
    steps: [
      { label: "ตรวจสอบปฏิทินว่าง", detail: null, duration: 700 },
      { label: "หาช่วงเวลาที่ตรงกัน", detail: "ผู้เข้าร่วม 3 คน", duration: 700 },
      { label: "จองห้องประชุม", detail: null, duration: 500 },
      { label: "ส่งคำเชิญ", detail: null, duration: 600 },
    ],
    result: "นัดประชุมเรียบร้อย พรุ่งนี้เวลา 15:00 น. ✅",
  },
  "สร้างรายงาน": {
    steps: [
      { label: "ดึงข้อมูลรายไตรมาสจากคลัง", detail: null, duration: 700 },
      { label: "ประมวลผลตัวชี้วัด", detail: null, duration: 900 },
      { label: "เรนเดอร์กราฟ", detail: null, duration: 700 },
      { label: "บันทึก PDF ลง Drive", detail: null, duration: 600 },
    ],
    result: "สร้างรายงานรายไตรมาสและบันทึกลง Drive เรียบร้อยแล้ว",
  },
  "ตรวจสอบงาน": {
    steps: [
      { label: "ดึง Task list จาก Notion", detail: null, duration: 500 },
      { label: "จัดกลุ่มตามความเร่งด่วน", detail: null, duration: 600 },
      { label: "ตรวจสอบ deadline ที่ใกล้มา", detail: "3 งานใน 48 ชม.", duration: 700 },
      { label: "สรุปและแจ้งเตือน", detail: null, duration: 400 },
    ],
    result: "พบ 3 งานเร่งด่วน และ 7 งานปกติ พร้อมแจ้งเตือนเรียบร้อยแล้ว 📋",
  },
  "ตอบลูกค้า": {
    steps: [
      { label: "อ่านข้อความจากลูกค้า", detail: null, duration: 400 },
      { label: "ค้นหาข้อมูลจาก Knowledge Base", detail: null, duration: 800 },
      { label: "ร่างคำตอบที่เหมาะสม", detail: null, duration: 900 },
      { label: "ส่งคำตอบกลับ", detail: null, duration: 400 },
    ],
    result: "ตอบลูกค้าเรียบร้อยแล้ว! ✉️ ลูกค้าได้รับคำตอบภายใน 2 นาที",
  },
  "สรุปข่าว": {
    steps: [
      { label: "ดึงข่าวจาก RSS feeds", detail: null, duration: 600 },
      { label: "กรองข่าวที่เกี่ยวข้อง", detail: "จาก 47 บทความ", duration: 700 },
      { label: "สรุปประเด็นสำคัญ", detail: null, duration: 1000 },
      { label: "จัดรูปแบบ Digest", detail: null, duration: 400 },
    ],
    result: "สรุปข่าววันนี้เรียบร้อย! 📰 คัดสรร 8 บทความสำคัญให้แล้ว",
  },
  "จัดการไฟล์": {
    steps: [
      { label: "สแกนโฟลเดอร์เป้าหมาย", detail: null, duration: 500 },
      { label: "จัดหมวดหมู่ไฟล์", detail: "ตามประเภทและวันที่", duration: 800 },
      { label: "ลบไฟล์ซ้ำและไฟล์ขยะ", detail: null, duration: 600 },
      { label: "สร้างรายงานการจัดการ", detail: null, duration: 400 },
    ],
    result: "จัดการไฟล์เรียบร้อย! 🗂️ ประหยัดพื้นที่ไป 2.4 GB",
  },
};

function defaultPlan(command) {
  return {
    steps: [
      { label: "ทำความเข้าใจคำสั่ง", detail: null, duration: 600 },
      { label: "กำลังดำเนินการ", detail: command, duration: 1200 },
      { label: "สรุปผล", detail: null, duration: 600 },
    ],
    result: `เสร็จเรียบร้อย! ดำเนินการ: "${command}"`,
  };
}

// ─── Concurrent task guard ─────────────────────────────────────────────────

const activeTasks = new Set(); // chatId strings currently running

// ─── Execute command ────────────────────────────────────────────────────────

async function executeCommand(command, chatId) {
  const chatKey = String(chatId);

  if (activeTasks.has(chatKey)) {
    await bot.sendMessage(chatId, "⏳ กำลังดำเนินการอยู่ครับ รอให้เสร็จก่อนนะ");
    return;
  }
  activeTasks.add(chatKey);

  try {
    let plan = await getAIPlan(command);
    if (!plan) plan = commandPlans[command] ?? defaultPlan(command);

    const taskId = randomUUID();
    const now = Date.now();

    const steps = plan.steps.map((s) => ({
      id: randomUUID(),
      label: s.label,
      detail: s.detail ?? undefined,
      status: "pending",
    }));

    broadcast({ type: "command", command });
    broadcast({ type: "status", status: "working", message: "รับทราบครับเจ้านาย! กำลังจัดการให้เลย…" });
    broadcast({
      type: "task-start",
      task: { id: taskId, command, result: "", status: "working", timestamp: now, startedAt: now, steps },
    });

    const statusMsg = await bot.sendMessage(
      chatId,
      `⚡ *รับทราบครับ!*\n\nกำลังดำเนินการ: *${command}*\n\n${steps.map((s) => `⬜ ${s.label}`).join("\n")}`,
      { parse_mode: "Markdown" }
    );

    const completedSteps = [];
    for (let i = 0; i < plan.steps.length; i++) {
      const planStep = plan.steps[i];
      const step = steps[i];

      await sleep(planStep.duration * 0.7);
      broadcast({ type: "task-step", taskId, step: { ...step, status: "running", startedAt: Date.now() } });
      broadcast({ type: "status", status: "working", message: `${step.label}…` });

      await sleep(planStep.duration * 0.3);
      broadcast({ type: "task-step", taskId, step: { ...step, status: "done", completedAt: Date.now() } });

      completedSteps.push(step);
      const remaining = steps.slice(completedSteps.length);

      try {
        await bot.editMessageText(
          `⚡ *กำลังดำเนินการ: ${command}*\n\n` +
            completedSteps.map((s) => `✅ ${s.label}`).join("\n") +
            (remaining.length > 0
              ? "\n" + remaining.map((s, ri) => (ri === 0 ? `⏳ ${s.label}` : `⬜ ${s.label}`)).join("\n")
              : ""),
          { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: "Markdown" }
        );
      } catch {}
    }

    broadcast({ type: "task-complete", taskId, result: plan.result });
    broadcast({ type: "status", status: "success", message: plan.result });
    await bot.sendMessage(chatId, `✅ *เสร็จแล้ว!*\n\n${plan.result}`, { parse_mode: "Markdown" });

    setTimeout(() => {
      broadcast({ type: "status", status: "idle", message: "พร้อมรับงานต่อไปแล้วครับ ☕" });
    }, 2500);
  } finally {
    activeTasks.delete(chatKey);
  }
}

// ─── Telegram bot ───────────────────────────────────────────────────────────

const bot = new TelegramBot(TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  const username = msg.from?.username ?? String(chatId);
  log(`📨 Telegram [${username}]: ${text}`);

  // Authorization check
  if (ALLOWED_CHAT_IDS && !ALLOWED_CHAT_IDS.has(String(chatId))) {
    await bot.sendMessage(chatId, "⛔ ขออภัย คุณไม่มีสิทธิ์ใช้งาน Hermes ครับ");
    log(`🚫 ปฏิเสธ [${username}] chatId=${chatId} (ไม่อยู่ใน ALLOWED_CHAT_IDS)`);
    return;
  }

  if (text === "/start") {
    await bot.sendMessage(
      chatId,
      `👋 *สวัสดีครับ! ผม Hermes พนักงาน AI ของคุณ*\n\n` +
        `ส่งคำสั่งมาได้เลยครับ:\n\n` +
        Object.keys(commandPlans)
          .map((k) => `• ${k}`)
          .join("\n") +
        (anthropic ? "\n\n🤖 _Claude AI พร้อมแล้ว — รับงานทุกประเภท!_" : "") +
        `\n\nหรือจะพิมพ์คำสั่งอื่นก็ได้ ผมจะพยายามดำเนินการให้ 😊`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (text === "/status") {
    const count = clients.size;
    await bot.sendMessage(
      chatId,
      `📊 *สถานะระบบ*\n\n` +
        `🔌 Web App: ${count > 0 ? `${count} client เชื่อมต่ออยู่` : "ไม่มีการเชื่อมต่อ"}\n` +
        `🤖 Bot: พร้อมรับงาน\n` +
        `🧠 AI: ${anthropic ? "Claude AI เปิดอยู่ ✅" : "Fallback mode"}`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (text === "/help") {
    await bot.sendMessage(
      chatId,
      `ℹ️ *คำสั่งที่รองรับ*\n\n` +
        `/start — เริ่มต้นใช้งาน\n` +
        `/status — ตรวจสอบสถานะระบบ\n` +
        `/help — แสดงความช่วยเหลือ\n\n` +
        `หรือส่งชื่องานตรงๆ ได้เลย เช่น "ส่งอีเมล" หรือ "นัดประชุม"`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // Rate limit check
  if (!checkRateLimit(chatId)) {
    await bot.sendMessage(
      chatId,
      `⏱ ส่งคำสั่งเร็วเกินไปครับ รอสักครู่แล้วลองใหม่ (${RATE_LIMIT_PER_MIN} คำสั่ง/นาที)`
    );
    log(`⏱  Rate limit [${username}] chatId=${chatId}`);
    return;
  }

  try {
    await executeCommand(text, chatId);
  } catch (err) {
    log(`❌ Error executing command: ${err.message}`);
    await bot.sendMessage(chatId, `❌ เกิดข้อผิดพลาด: ${err.message}`);
    broadcast({ type: "status", status: "error", message: `เกิดข้อผิดพลาด: ${err.message}` });
  }
});

bot.on("polling_error", (err) => log(`❌ Polling error: ${err.message}`));

// ─── Graceful shutdown ──────────────────────────────────────────────────────

function shutdown(signal) {
  log(`${signal} received — ปิด bridge อย่างสะอาด...`);
  bot.stopPolling();
  wss.close(() => {
    log("✅ ปิดเรียบร้อยครับ");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ─── Startup banner ────────────────────────────────────────────────────────

log(`\n🤖 Hermes Telegram Bridge พร้อมแล้ว!`);
log(`📱 Telegram bot กำลัง polling...`);
log(`🔌 WebSocket server: ws://localhost:${WS_PORT}`);
if (WS_SECRET) log(`🔐 WebSocket auth: เปิดอยู่ (WS_SECRET ตั้งแล้ว)`);
if (ALLOWED_CHAT_IDS) log(`✅ Allowed chat IDs: ${[...ALLOWED_CHAT_IDS].join(", ")}`);
log(`⏱  Rate limit: ${RATE_LIMIT_PER_MIN} คำสั่ง/นาที ต่อ chat`);
log(`\nขั้นตอนต่อไป:`);
if (WS_SECRET) {
  log(`  1. เปิด Web App → หน้า Gateway → เชื่อมต่อ ws://localhost:${WS_PORT}`);
  log(`  2. ใส่ Secret Key: YOUR_WS_SECRET`);
} else {
  log(`  1. เปิด Web App → หน้า Gateway`);
  log(`  2. เชื่อมต่อ ws://localhost:${WS_PORT}`);
}
log(`  3. ส่งคำสั่งผ่าน Telegram ได้เลย!\n`);
