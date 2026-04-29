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
 */

import TelegramBot from "node-telegram-bot-api";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WS_PORT = Number(process.env.WS_PORT ?? 18789);

if (!TOKEN) {
  console.error("❌ ไม่พบ TELEGRAM_BOT_TOKEN ใน .env");
  process.exit(1);
}

// ─── WebSocket server ───────────────────────────────────────────────────────

const wss = new WebSocketServer({ host: "0.0.0.0", port: WS_PORT });
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`🔌 Web App เชื่อมต่อแล้ว (${clients.size} clients)`);
  broadcast({ type: "status", status: "idle", message: "พร้อมรับงานครับ ☕" });

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "ping") ws.send(JSON.stringify({ type: "pong" }));
    } catch {}
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`🔌 Web App ตัดการเชื่อมต่อ (เหลือ ${clients.size} clients)`);
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

// ─── Command plans ─────────────────────────────────────────────────────────

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

// ─── Execute command ────────────────────────────────────────────────────────

async function executeCommand(command, chatId) {
  const plan = commandPlans[command] ?? defaultPlan(command);
  const taskId = randomUUID();
  const now = Date.now();

  const steps = plan.steps.map((s) => ({
    id: randomUUID(),
    label: s.label,
    detail: s.detail ?? undefined,
    status: "pending",
  }));

  // Broadcast to web app
  broadcast({ type: "command", command });
  broadcast({ type: "status", status: "working", message: "รับทราบครับเจ้านาย! กำลังจัดการให้เลย…" });
  broadcast({
    type: "task-start",
    task: { id: taskId, command, result: "", status: "working", timestamp: now, startedAt: now, steps },
  });

  // Notify Telegram
  const statusMsg = await bot.sendMessage(
    chatId,
    `⚡ *รับทราบครับ!*\n\nกำลังดำเนินการ: *${command}*\n\n${steps.map((s) => `⬜ ${s.label}`).join("\n")}`,
    { parse_mode: "Markdown" }
  );

  // Execute each step
  const completedSteps = [];
  for (let i = 0; i < plan.steps.length; i++) {
    const planStep = plan.steps[i];
    const step = steps[i];

    // Mark running
    await sleep(planStep.duration * 0.7);
    broadcast({ type: "task-step", taskId, step: { ...step, status: "running", startedAt: Date.now() } });
    broadcast({ type: "status", status: "working", message: `${step.label}…` });

    // Mark done
    await sleep(planStep.duration * 0.3);
    broadcast({ type: "task-step", taskId, step: { ...step, status: "done", completedAt: Date.now() } });

    completedSteps.push(step);
    const remaining = steps.slice(completedSteps.length);

    // Update Telegram message with live progress
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

  // Complete
  broadcast({ type: "task-complete", taskId, result: plan.result });
  broadcast({ type: "status", status: "success", message: plan.result });

  // Final Telegram message
  await bot.sendMessage(chatId, `✅ *เสร็จแล้ว!*\n\n${plan.result}`, { parse_mode: "Markdown" });

  setTimeout(() => {
    broadcast({ type: "status", status: "idle", message: "พร้อมรับงานต่อไปแล้วครับ ☕" });
  }, 2500);
}

// ─── Telegram bot ───────────────────────────────────────────────────────────

const bot = new TelegramBot(TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  console.log(`📨 Telegram [${msg.from?.username ?? chatId}]: ${text}`);

  if (text === "/start") {
    await bot.sendMessage(
      chatId,
      `👋 *สวัสดีครับ! ผม Hermes พนักงาน AI ของคุณ*\n\n` +
        `ส่งคำสั่งมาได้เลยครับ:\n\n` +
        Object.keys(commandPlans)
          .map((k) => `• ${k}`)
          .join("\n") +
        `\n\nหรือจะพิมพ์คำสั่งอื่นก็ได้ ผมจะพยายามดำเนินการให้ 😊`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (text === "/status") {
    const count = clients.size;
    await bot.sendMessage(
      chatId,
      `📊 *สถานะระบบ*\n\n🔌 Web App: ${count > 0 ? `${count} client เชื่อมต่ออยู่` : "ไม่มีการเชื่อมต่อ"}\n🤖 Bot: พร้อมรับงาน`,
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

  // Execute as command
  try {
    await executeCommand(text, chatId);
  } catch (err) {
    console.error("Error executing command:", err);
    await bot.sendMessage(chatId, `❌ เกิดข้อผิดพลาด: ${err.message}`);
    broadcast({ type: "status", status: "error", message: `เกิดข้อผิดพลาด: ${err.message}` });
  }
});

bot.on("polling_error", (err) => console.error("Polling error:", err.message));

console.log(`\n🤖 Hermes Telegram Bridge พร้อมแล้ว!`);
console.log(`📱 Telegram bot กำลัง polling...`);
console.log(`🔌 WebSocket server: ws://localhost:${WS_PORT}`);
console.log(`\nขั้นตอนต่อไป:`);
console.log(`  1. เปิด Web App → หน้า Gateway`);
console.log(`  2. เชื่อมต่อ ws://localhost:${WS_PORT}`);
console.log(`  3. ส่งคำสั่งผ่าน Telegram ได้เลย!\n`);
