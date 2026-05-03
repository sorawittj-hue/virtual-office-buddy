/**
 * Hermes Telegram Bridge
 *
 * รัน: node --env-file=.env telegram-bridge.js
 *
 * สิ่งที่ทำ:
 *  1. เปิด WebSocket server รอ Web App เชื่อมต่อ
 *  2. รับคำสั่งจาก Telegram bot (polling)
 *  3. ส่งคำสั่งจริงๆ ไปยัง Hermes LLM ผ่าน OpenRouter
 *  4. Stream ผลลัพธ์แบบ real-time ไปที่ Web App ทุก step
 *  5. ส่งคำตอบกลับ Telegram
 *
 * Priority การประมวลผล:
 *  1. OpenRouter (Hermes LLM) — ถ้ามี OPENROUTER_API_KEY
 *  2. Anthropic (Claude)      — ถ้ามี ANTHROPIC_API_KEY
 *  3. Hardcoded fallback plans
 *
 * ความปลอดภัย:
 *  - ALLOWED_CHAT_IDS  จำกัด Telegram user ที่อนุญาต
 *  - WS_SECRET         ยืนยันตัวตน WebSocket client (?token=...)
 *  - Rate limiting     จำกัด RATE_LIMIT_PER_MIN คำสั่ง/นาที ต่อ chat
 */

import TelegramBot from "node-telegram-bot-api";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";
import {
  createRateLimiter,
  escapeTelegramHtml,
  parsePositiveInteger,
  simulatedResult,
} from "./server-utils.js";

// ─── Config ────────────────────────────────────────────────────────────────

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const isProduction = process.env.NODE_ENV === "production";
const WS_PORT = parsePositiveInteger(process.env.WS_PORT, 18789, "WS_PORT", {
  min: 1,
  max: 65535,
});
const WS_SECRET = process.env.WS_SECRET ?? "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const HERMES_MODEL = process.env.HERMES_MODEL ?? "nousresearch/hermes-3-llama-3.1-405b:free";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const RATE_LIMIT_PER_MIN = parsePositiveInteger(
  process.env.RATE_LIMIT_PER_MIN,
  5,
  "RATE_LIMIT_PER_MIN",
  { min: 1, max: 1000 },
);
const MAX_COMMAND_CHARS = parsePositiveInteger(
  process.env.MAX_COMMAND_CHARS,
  4000,
  "MAX_COMMAND_CHARS",
  { min: 1, max: 20000 },
);

const ALLOWED_CHAT_IDS = process.env.ALLOWED_CHAT_IDS
  ? new Set(process.env.ALLOWED_CHAT_IDS.split(",").map((s) => s.trim()))
  : null;

if (!TOKEN) {
  console.error("❌ ไม่พบ TELEGRAM_BOT_TOKEN ใน .env");
  process.exit(1);
}
if (isProduction && !WS_SECRET) {
  console.error("WS_SECRET is required when NODE_ENV=production");
  process.exit(1);
}
if (isProduction && WS_SECRET.length < 24) {
  console.error("WS_SECRET must be at least 24 characters when NODE_ENV=production");
  process.exit(1);
}
if (isProduction && !ALLOWED_CHAT_IDS) {
  console.error("ALLOWED_CHAT_IDS is required when NODE_ENV=production");
  process.exit(1);
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

if (!WS_SECRET) log("⚠️  WS_SECRET ไม่ได้ตั้งค่า — WebSocket ไม่มีการยืนยันตัวตน");
if (!ALLOWED_CHAT_IDS) log("⚠️  ALLOWED_CHAT_IDS ไม่ได้ตั้งค่า — Bot รับคำสั่งจากทุกคน");

// ─── OpenRouter / Hermes LLM ───────────────────────────────────────────────

let openai = null;
if (OPENROUTER_API_KEY) {
  const { default: OpenAI } = await import("openai");
  openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": "https://github.com/sorawittj-hue/virtual-office-buddy",
      "X-Title": "Virtual Office Buddy",
    },
  });
  log(`🤖 Hermes (OpenRouter) พร้อมแล้ว — model: ${HERMES_MODEL}`);
}

// ─── Anthropic AI (fallback) ───────────────────────────────────────────────

let anthropic = null;
if (!openai && ANTHROPIC_API_KEY) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  log("🤖 Claude AI (Anthropic) พร้อมแล้ว — fallback mode");
}

if (!openai && !anthropic) {
  log("ℹ️  ไม่มี AI API — ใช้ hardcoded fallback plans");
}

// ─── Rate limiting ─────────────────────────────────────────────────────────

const checkRateLimit = createRateLimiter(RATE_LIMIT_PER_MIN);
const checkWsRateLimit = createRateLimiter(RATE_LIMIT_PER_MIN);

// ─── WebSocket server ───────────────────────────────────────────────────────

const wss = new WebSocketServer({ host: "0.0.0.0", port: WS_PORT });
const clients = new Set();
// Per-client chat history for conversation context
const chatHistories = new Map(); // ws -> [{role, content}]

wss.on("connection", (ws, req) => {
  if (WS_SECRET) {
    const params = new URL(req.url ?? "/", "http://localhost").searchParams;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const queryToken = params.get("token") ?? "";
    if (bearerToken !== WS_SECRET && queryToken !== WS_SECRET) {
      ws.close(4001, "Unauthorized");
      log(`🚫 WebSocket: ปฏิเสธการเชื่อมต่อ (token ไม่ถูกต้อง) จาก ${req.socket.remoteAddress}`);
      return;
    }
    if (!bearerToken && queryToken) {
      log(
        "Warning: WebSocket query-string token accepted for compatibility; prefer Authorization: Bearer in production.",
      );
    }
  }

  clients.add(ws);
  chatHistories.set(ws, []);
  log(`🔌 Web App เชื่อมต่อแล้ว (${clients.size} clients)`);
  broadcast({ type: "status", status: "idle", message: "พร้อมรับงานครับ ☕" });

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", ts: Date.now() }));
      } else if (msg.type === "chat-message" && msg.content) {
        if (!checkWsRateLimit(req.socket.remoteAddress ?? "ws-client")) {
          ws.send(JSON.stringify({ type: "error", message: "Rate limit exceeded" }));
          return;
        }
        const content = String(msg.content);
        if (content.length > MAX_COMMAND_CHARS) {
          ws.send(JSON.stringify({ type: "error", message: "Message is too long" }));
          return;
        }
        handleChatMessage(ws, content);
      }
    } catch {}
  });

  ws.on("close", () => {
    clients.delete(ws);
    chatHistories.delete(ws);
    log(`🔌 Web App ตัดการเชื่อมต่อ (เหลือ ${clients.size} clients)`);
  });
});

// ─── Chat message handler (streaming per-client) ───────────────────────────

async function handleChatMessage(ws, content) {
  if (ws.readyState !== WebSocket.OPEN) return;

  const history = chatHistories.get(ws) ?? [];
  history.push({ role: "user", content });

  const replyId = randomUUID();

  if (!openai) {
    // No AI — send a simple text reply
    ws.send(
      JSON.stringify({
        type: "chat-stream",
        id: replyId,
        token:
          "⚠️ ไม่มี AI API ครับ กรุณาตั้งค่า `OPENROUTER_API_KEY` ใน `.env` แล้วรัน bridge ใหม่",
        done: true,
      }),
    );
    return;
  }

  // Signal start of streaming
  ws.send(JSON.stringify({ type: "chat-stream", id: replyId, token: "", done: false }));

  try {
    const stream = await openai.chat.completions.create({
      model: HERMES_MODEL,
      stream: true,
      max_tokens: 2048,
      messages: [
        { role: "system", content: HERMES_SYSTEM },
        ...history.slice(-20), // keep last 20 messages for context
      ],
    });

    let fullReply = "";
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content ?? "";
      if (token && ws.readyState === WebSocket.OPEN) {
        fullReply += token;
        ws.send(JSON.stringify({ type: "chat-stream", id: replyId, token, done: false }));
      }
    }

    // Save assistant reply to history
    if (fullReply) history.push({ role: "assistant", content: fullReply });
    if (history.length > 40) history.splice(0, history.length - 40);
    chatHistories.set(ws, history);

    ws.send(JSON.stringify({ type: "chat-stream", id: replyId, token: "", done: true }));
    log(`💬 Chat reply: ${fullReply.slice(0, 60)}…`);
  } catch (err) {
    log(`⚠️  Chat stream error: ${err.message}`);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "chat-stream",
          token: isProduction ? "\n\nRequest failed." : `\n\nError: ${err.message}`,
          token: `\n\n❌ Error: ${err.message}`,
          done: true,
        }),
      );
    }
  }
}

function broadcast(event) {
  const json = JSON.stringify(event);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(json);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Hermes LLM call (OpenRouter) ─────────────────────────────────────────

const HERMES_SYSTEM = `คุณคือ Hermes ผู้ช่วย AI ออฟฟิศที่ฉลาด ทำงานเก่ง และสุภาพ
รับคำสั่งจากเจ้านายแล้วดำเนินการและรายงานผล ตอบเป็นภาษาไทย กระชับ และมีประโยชน์`;

async function callHermes(command, onToken) {
  if (!openai) return null;
  try {
    const stream = await openai.chat.completions.create({
      model: HERMES_MODEL,
      stream: true,
      max_tokens: 1024,
      messages: [
        { role: "system", content: HERMES_SYSTEM },
        { role: "user", content: command },
      ],
    });

    let fullText = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) {
        fullText += delta;
        onToken?.(delta, fullText);
      }
    }
    return fullText || null;
  } catch (err) {
    log(`⚠️  Hermes API ล้มเหลว: ${err.message}`);
    return null;
  }
}

// ─── Claude plan (Anthropic fallback) ─────────────────────────────────────

const CLAUDE_PLAN_PROMPT = `คุณคือ Hermes ผู้ช่วย AI ออฟฟิศ ตอบในรูปแบบ JSON เท่านั้น
{
  "steps": [{"label": "ชื่อขั้นตอน", "detail": null, "duration": 800}],
  "result": "สรุปผลลัพธ์ พร้อม emoji"
}
กฎ: 3-5 steps, duration 400-1200ms, ใช้ภาษาไทย`;

async function getClaudePlan(command) {
  if (!anthropic) return null;
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: [{ type: "text", text: CLAUDE_PLAN_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `งาน: ${command}` }],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    return JSON.parse(
      text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim(),
    );
  } catch (err) {
    log(`⚠️  Claude plan ล้มเหลว: ${err.message}`);
    return null;
  }
}

// ─── Fallback command plans ────────────────────────────────────────────────

const commandPlans = {
  ส่งอีเมล: {
    steps: [
      { label: "วิเคราะห์ผู้รับและจุดประสงค์", detail: null, duration: 600 },
      { label: "ร่างเนื้อหาอีเมล", detail: "ใช้น้ำเสียงเป็นกันเอง", duration: 900 },
      { label: "ตรวจทานคำผิด", detail: null, duration: 500 },
      { label: "ส่งผ่าน SMTP", detail: null, duration: 700 },
    ],
    result: "ส่งอีเมลเรียบร้อย! 📬",
  },
  ค้นหาข้อมูล: {
    steps: [
      { label: "เชื่อมต่อแหล่งข้อมูล", detail: null, duration: 500 },
      { label: "กำลังค้นหา", detail: "สแกน 3 ดัชนี", duration: 800 },
      { label: "จัดอันดับผลลัพธ์", detail: null, duration: 600 },
      { label: "สรุปสิ่งที่พบ", detail: null, duration: 700 },
    ],
    result: "พบข้อมูลที่เกี่ยวข้อง 12 รายการ",
  },
  นัดประชุม: {
    steps: [
      { label: "ตรวจสอบปฏิทินว่าง", detail: null, duration: 700 },
      { label: "หาช่วงเวลาที่ตรงกัน", detail: "ผู้เข้าร่วม 3 คน", duration: 700 },
      { label: "จองห้องประชุม", detail: null, duration: 500 },
      { label: "ส่งคำเชิญ", detail: null, duration: 600 },
    ],
    result: "นัดประชุมเรียบร้อย พรุ่งนี้เวลา 15:00 น. ✅",
  },
  สร้างรายงาน: {
    steps: [
      { label: "ดึงข้อมูลจากคลัง", detail: null, duration: 700 },
      { label: "ประมวลผลตัวชี้วัด", detail: null, duration: 900 },
      { label: "เรนเดอร์กราฟ", detail: null, duration: 700 },
      { label: "บันทึก PDF", detail: null, duration: 600 },
    ],
    result: "สร้างรายงานและบันทึกลง Drive เรียบร้อยแล้ว 📊",
  },
  ตรวจสอบงาน: {
    steps: [
      { label: "ดึง Task list", detail: null, duration: 500 },
      { label: "จัดกลุ่มตามความเร่งด่วน", detail: null, duration: 600 },
      { label: "ตรวจสอบ deadline", detail: "3 งานใน 48 ชม.", duration: 700 },
      { label: "สรุปและแจ้งเตือน", detail: null, duration: 400 },
    ],
    result: "พบ 3 งานเร่งด่วน และ 7 งานปกติ 📋",
  },
  ตอบลูกค้า: {
    steps: [
      { label: "อ่านข้อความจากลูกค้า", detail: null, duration: 400 },
      { label: "ค้นหาข้อมูลจาก Knowledge Base", detail: null, duration: 800 },
      { label: "ร่างคำตอบที่เหมาะสม", detail: null, duration: 900 },
      { label: "ส่งคำตอบกลับ", detail: null, duration: 400 },
    ],
    result: "ตอบลูกค้าเรียบร้อยแล้ว! ✉️",
  },
  สรุปข่าว: {
    steps: [
      { label: "ดึงข่าวจาก RSS feeds", detail: null, duration: 600 },
      { label: "กรองข่าวที่เกี่ยวข้อง", detail: "จาก 47 บทความ", duration: 700 },
      { label: "สรุปประเด็นสำคัญ", detail: null, duration: 1000 },
      { label: "จัดรูปแบบ Digest", detail: null, duration: 400 },
    ],
    result: "สรุปข่าววันนี้เรียบร้อย! 📰 คัดสรร 8 บทความสำคัญ",
  },
  จัดการไฟล์: {
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
    result: `เสร็จเรียบร้อย: "${command}"`,
  };
}

// ─── Concurrent task guard ─────────────────────────────────────────────────

const activeTasks = new Set();

// ─── Execute with Hermes LLM (OpenRouter) ─────────────────────────────────

async function executeWithHermes(command, chatId) {
  const taskId = randomUUID();
  const now = Date.now();

  const steps = [
    { id: randomUUID(), label: "เชื่อมต่อ Hermes Agent", detail: HERMES_MODEL, status: "pending" },
    { id: randomUUID(), label: "ส่งคำสั่งไปยัง Hermes", detail: null, status: "pending" },
    { id: randomUUID(), label: "Hermes กำลังประมวลผล", detail: "กำลังคิด…", status: "pending" },
    { id: randomUUID(), label: "รับผลลัพธ์", detail: null, status: "pending" },
  ];

  broadcast({ type: "command", command });
  broadcast({ type: "status", status: "working", message: "ส่งคำสั่งไปยัง Hermes แล้วครับ…" });
  broadcast({
    type: "task-start",
    task: {
      id: taskId,
      command,
      result: "",
      status: "working",
      timestamp: now,
      startedAt: now,
      steps,
    },
  });

  const statusMsg = await bot.sendMessage(
    chatId,
    `⚡ *รับทราบครับ!*\n\nส่งคำสั่งไปยัง Hermes: *${command}*\n\n` +
      steps.map((s) => `⬜ ${s.label}`).join("\n"),
    { parse_mode: "Markdown" },
  );

  const markStep = async (idx, status, detail) => {
    const step = { ...steps[idx], status };
    if (detail) step.detail = detail;
    broadcast({ type: "task-step", taskId, step });

    const lines = steps.map((s, i) => {
      if (i < idx || (i === idx && status === "done")) return `✅ ${s.label}`;
      if (i === idx) return `⏳ ${s.label}`;
      return `⬜ ${s.label}`;
    });
    try {
      await bot.editMessageText(`⚡ *กำลังดำเนินการ: ${command}*\n\n${lines.join("\n")}`, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: "Markdown",
      });
    } catch {}
  };

  // Step 0: connecting
  await markStep(0, "running");
  await sleep(400);
  await markStep(0, "done");

  // Step 1: sending
  await markStep(1, "running");
  await sleep(200);
  await markStep(1, "done");

  // Step 2: Hermes processing (actual API call with streaming)
  await markStep(2, "running", "กำลังคิด…");
  broadcast({ type: "status", status: "working", message: "Hermes กำลังประมวลผล…" });

  let tokenCount = 0;
  const response = await callHermes(command, (delta, full) => {
    tokenCount++;
    // Update dashboard every 10 tokens to show progress
    if (tokenCount % 10 === 0) {
      broadcast({
        type: "status",
        status: "working",
        message: `Hermes กำลังตอบ… (${tokenCount} tokens)`,
      });
    }
  });

  await markStep(2, "done", `${tokenCount} tokens`);

  // Step 3: receiving result
  await markStep(3, "running");
  await sleep(200);
  await markStep(3, "done");

  const result = response ?? "Hermes ไม่ได้ส่งคำตอบกลับมาครับ";

  broadcast({ type: "task-complete", taskId, result });
  broadcast({ type: "status", status: "success", message: result.slice(0, 80) });

  await bot.sendMessage(chatId, `✅ *Hermes ตอบแล้ว:*\n\n${result}`, { parse_mode: "Markdown" });

  setTimeout(() => {
    broadcast({ type: "status", status: "idle", message: "พร้อมรับงานต่อไปแล้วครับ ☕" });
  }, 2500);
}

// ─── Execute with Claude / fallback ────────────────────────────────────────

async function executeWithPlan(command, chatId) {
  let plan = await getClaudePlan(command);
  if (!plan) {
    plan = commandPlans[command] ?? defaultPlan(command);
    plan = { ...plan, result: simulatedResult(plan.result) };
  }

  const taskId = randomUUID();
  const now = Date.now();
  const steps = plan.steps.map((s) => ({
    id: randomUUID(),
    label: s.label,
    detail: s.detail ?? undefined,
    status: "pending",
  }));

  broadcast({ type: "command", command });
  broadcast({ type: "status", status: "working", message: "รับทราบครับ! กำลังจัดการ…" });
  broadcast({
    type: "task-start",
    task: {
      id: taskId,
      command,
      result: "",
      status: "working",
      timestamp: now,
      startedAt: now,
      steps,
    },
  });

  const statusMsg = await bot.sendMessage(
    chatId,
    `⚡ *รับทราบครับ!*\n\nกำลังดำเนินการ: *${command}*\n\n${steps.map((s) => `⬜ ${s.label}`).join("\n")}`,
    { parse_mode: "Markdown" },
  );

  const completedSteps = [];
  for (let i = 0; i < plan.steps.length; i++) {
    const planStep = plan.steps[i];
    const step = steps[i];

    await sleep(planStep.duration * 0.7);
    broadcast({
      type: "task-step",
      taskId,
      step: { ...step, status: "running", startedAt: Date.now() },
    });
    broadcast({ type: "status", status: "working", message: `${step.label}…` });

    await sleep(planStep.duration * 0.3);
    broadcast({
      type: "task-step",
      taskId,
      step: { ...step, status: "done", completedAt: Date.now() },
    });

    completedSteps.push(step);
    const remaining = steps.slice(completedSteps.length);
    try {
      await bot.editMessageText(
        `⚡ *กำลังดำเนินการ: ${command}*\n\n` +
          completedSteps.map((s) => `✅ ${s.label}`).join("\n") +
          (remaining.length > 0
            ? "\n" +
              remaining.map((s, ri) => (ri === 0 ? `⏳ ${s.label}` : `⬜ ${s.label}`)).join("\n")
            : ""),
        { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: "Markdown" },
      );
    } catch {}
  }

  broadcast({ type: "task-complete", taskId, result: plan.result });
  broadcast({ type: "status", status: "success", message: plan.result });
  await bot.sendMessage(chatId, `✅ *เสร็จแล้ว!*\n\n${plan.result}`, { parse_mode: "Markdown" });

  setTimeout(() => {
    broadcast({ type: "status", status: "idle", message: "พร้อมรับงานต่อไปแล้วครับ ☕" });
  }, 2500);
}

// ─── Main execute dispatcher ────────────────────────────────────────────────

async function executeCommand(command, chatId) {
  const chatKey = String(chatId);
  if (activeTasks.has(chatKey)) {
    await bot.sendMessage(chatId, "⏳ กำลังดำเนินการอยู่ครับ รอให้เสร็จก่อนนะ");
    return;
  }
  activeTasks.add(chatKey);
  try {
    if (openai) {
      await executeWithHermes(command, chatId);
    } else {
      await executeWithPlan(command, chatId);
    }
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
  if (text.length > MAX_COMMAND_CHARS) {
    await bot.sendMessage(
      chatId,
      `Message is too long. Limit: ${escapeTelegramHtml(MAX_COMMAND_CHARS)} characters.`,
      {
        parse_mode: "HTML",
      },
    );
    return;
  }

  const username = msg.from?.username ?? String(chatId);
  log(`📨 Telegram [${username}]: ${text}`);

  if (ALLOWED_CHAT_IDS && !ALLOWED_CHAT_IDS.has(String(chatId))) {
    await bot.sendMessage(chatId, "⛔ ขออภัย คุณไม่มีสิทธิ์ใช้งาน Hermes ครับ");
    log(`🚫 ปฏิเสธ [${username}] chatId=${chatId}`);
    return;
  }

  if (text === "/start") {
    const aiMode = openai
      ? `🤖 _Hermes LLM (${HERMES_MODEL}) พร้อมแล้ว!_`
      : anthropic
        ? `🤖 _Claude AI พร้อมแล้ว (fallback)_`
        : `⚠️ _ใช้ hardcoded plans (ไม่มี AI API)_`;
    await bot.sendMessage(
      chatId,
      `👋 *สวัสดีครับ! ผม Hermes พนักงาน AI ของคุณ*\n\n${aiMode}\n\n` +
        `ส่งคำสั่งใดก็ได้มาเลยครับ ผมจะพยายามดำเนินการให้ 😊\n\n` +
        `คำสั่งพื้นฐาน:\n` +
        Object.keys(commandPlans)
          .map((k) => `• ${k}`)
          .join("\n") +
        `\n\nหรือพิมพ์อะไรก็ได้ — Hermes จะตอบให้!`,
      { parse_mode: "Markdown" },
    );
    return;
  }

  if (text === "/status") {
    await bot.sendMessage(
      chatId,
      `📊 *สถานะระบบ*\n\n` +
        `🔌 Web App: ${clients.size > 0 ? `${clients.size} client เชื่อมต่ออยู่` : "ไม่มีการเชื่อมต่อ"}\n` +
        `🤖 Bot: พร้อมรับงาน\n` +
        `🧠 AI: ${openai ? `Hermes (${HERMES_MODEL})` : anthropic ? "Claude AI" : "Fallback mode"}`,
      { parse_mode: "Markdown" },
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
        `หรือพิมพ์อะไรก็ได้ เช่น "สรุปข่าว" หรือ "ช่วยเขียน email ถึงลูกค้า"`,
      { parse_mode: "Markdown" },
    );
    return;
  }

  if (!checkRateLimit(chatId)) {
    await bot.sendMessage(chatId, `⏱ ส่งคำสั่งเร็วเกินไปครับ (${RATE_LIMIT_PER_MIN} คำสั่ง/นาที)`);
    return;
  }

  try {
    await executeCommand(text, chatId);
  } catch (err) {
    const userMessage = isProduction
      ? "Request failed. Check server logs for details."
      : escapeTelegramHtml(err.message);
    await bot.sendMessage(chatId, userMessage, { parse_mode: "HTML" });
    broadcast({ type: "status", status: "error", message: userMessage });
  }
});

bot.on("polling_error", (err) => log(`❌ Polling error: ${err.message}`));

// ─── Graceful shutdown ──────────────────────────────────────────────────────

function shutdown(signal) {
  log(`${signal} — ปิด bridge อย่างสะอาด...`);
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
if (WS_SECRET) log(`🔐 WebSocket auth: เปิดอยู่`);
if (ALLOWED_CHAT_IDS) log(`✅ Allowed chat IDs: ${[...ALLOWED_CHAT_IDS].join(", ")}`);
log(`⏱  Rate limit: ${RATE_LIMIT_PER_MIN} คำสั่ง/นาที`);
log(
  `🧠 AI: ${openai ? `Hermes LLM (${HERMES_MODEL})` : anthropic ? "Claude AI (fallback)" : "Hardcoded plans"}\n`,
);
