/**
 * Hermes service: mock implementation.
 *
 * Swap `MockHermesServiceImpl` with a WebSocket / API client later.
 * Anything implementing `HermesService` will plug into the UI without changes.
 */
import type { HermesEvent, TaskLogEntry, TaskStep } from "./hermes-types";

export interface HermesService {
  subscribe(listener: (event: HermesEvent) => void): () => void;
  simulateTelegramWebhook(command: string): void;
  simulateError(command: string): void;
}

interface CommandPlan {
  steps: { label: string; detail?: string; duration: number }[];
  result: string;
}

const commandPlans: Record<string, CommandPlan> = {
  "ส่งอีเมล": {
    steps: [
      { label: "วิเคราะห์ผู้รับและจุดประสงค์", duration: 600 },
      { label: "ร่างเนื้อหาอีเมล", detail: "ใช้น้ำเสียงเป็นกันเอง", duration: 900 },
      { label: "ตรวจทานคำผิด", duration: 500 },
      { label: "ส่งผ่าน SMTP", detail: "ไปยัง inbox@example.com", duration: 700 },
    ],
    result: "ส่งอีเมลเรียบร้อย! 📬 ร่าง ตรวจทาน และจัดส่งครบถ้วน",
  },
  "ค้นหาข้อมูล": {
    steps: [
      { label: "เชื่อมต่อแหล่งข้อมูล", duration: 500 },
      { label: "กำลังค้นหา", detail: "สแกน 3 ดัชนี", duration: 800 },
      { label: "จัดอันดับผลลัพธ์ 12 รายการ", duration: 600 },
      { label: "สรุปสิ่งที่พบ", duration: 700 },
    ],
    result: "พบข้อมูลที่เกี่ยวข้อง 12 รายการ และสรุปให้เรียบร้อยแล้ว",
  },
  "นัดประชุม": {
    steps: [
      { label: "ตรวจสอบปฏิทินว่าง", duration: 700 },
      { label: "หาช่วงเวลาที่ตรงกัน", detail: "ผู้เข้าร่วม 3 คน", duration: 700 },
      { label: "จองห้องประชุม", duration: 500 },
      { label: "ส่งคำเชิญ", duration: 600 },
    ],
    result: "นัดประชุมเรียบร้อย พรุ่งนี้เวลา 15:00 น. ✅",
  },
  "สร้างรายงาน": {
    steps: [
      { label: "ดึงข้อมูลรายไตรมาสจากคลัง", duration: 700 },
      { label: "ประมวลผลตัวชี้วัด", duration: 900 },
      { label: "เรนเดอร์กราฟ", duration: 700 },
      { label: "บันทึก PDF ลง Drive", duration: 600 },
    ],
    result: "สร้างรายงานรายไตรมาสและบันทึกลง Drive เรียบร้อยแล้ว",
  },
  "ตรวจสอบงาน": {
    steps: [
      { label: "ดึง Task list จาก Notion", duration: 500 },
      { label: "จัดกลุ่มตามความเร่งด่วน", duration: 600 },
      { label: "ตรวจสอบ deadline ที่ใกล้มา", detail: "3 งานใน 48 ชม.", duration: 700 },
      { label: "สรุปและแจ้งเตือน", duration: 400 },
    ],
    result: "พบ 3 งานเร่งด่วน และ 7 งานปกติ พร้อมแจ้งเตือนเรียบร้อยแล้ว 📋",
  },
  "ตอบลูกค้า": {
    steps: [
      { label: "อ่านข้อความจากลูกค้า", duration: 400 },
      { label: "ค้นหาข้อมูลที่เกี่ยวข้อง", detail: "จาก Knowledge Base", duration: 800 },
      { label: "ร่างคำตอบที่เหมาะสม", duration: 900 },
      { label: "ส่งคำตอบกลับ", duration: 400 },
    ],
    result: "ตอบลูกค้าเรียบร้อยแล้ว! ✉️ ลูกค้าได้รับคำตอบภายใน 2 นาที",
  },
  "สรุปข่าว": {
    steps: [
      { label: "ดึงข่าวจาก RSS feeds", duration: 600 },
      { label: "กรองข่าวที่เกี่ยวข้อง", detail: "จาก 47 บทความ", duration: 700 },
      { label: "สรุปประเด็นสำคัญ", duration: 1000 },
      { label: "จัดรูปแบบ Digest", duration: 400 },
    ],
    result: "สรุปข่าววันนี้เรียบร้อย! 📰 คัดสรร 8 บทความสำคัญให้แล้ว",
  },
  "จัดการไฟล์": {
    steps: [
      { label: "สแกนโฟลเดอร์เป้าหมาย", duration: 500 },
      { label: "จัดหมวดหมู่ไฟล์", detail: "ตามประเภทและวันที่", duration: 800 },
      { label: "ลบไฟล์ซ้ำและไฟล์ขยะ", duration: 600 },
      { label: "สร้างรายงานการจัดการ", duration: 400 },
    ],
    result: "จัดการไฟล์เรียบร้อย! 🗂️ ประหยัดพื้นที่ไป 2.4 GB",
  },
};

const defaultPlan = (command: string): CommandPlan => ({
  steps: [
    { label: "ทำความเข้าใจคำสั่ง", duration: 600 },
    { label: "กำลังดำเนินการ", detail: command, duration: 1200 },
    { label: "กำลังสรุปผล", duration: 600 },
  ],
  result: `เสร็จเรียบร้อย! ดำเนินการ: "${command}"`,
});

class MockHermesServiceImpl implements HermesService {
  private listeners = new Set<(e: HermesEvent) => void>();
  private timers: ReturnType<typeof setTimeout>[] = [];

  subscribe(listener: (e: HermesEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: HermesEvent) {
    this.listeners.forEach((l) => l(event));
  }

  private clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  private schedule(fn: () => void, delay: number) {
    this.timers.push(setTimeout(fn, delay));
  }

  simulateTelegramWebhook(command: string) {
    this.clearTimers();

    const plan = commandPlans[command] ?? defaultPlan(command);
    const taskId = crypto.randomUUID();
    const now = Date.now();

    const steps: TaskStep[] = plan.steps.map((s) => ({
      id: crypto.randomUUID(),
      label: s.label,
      detail: s.detail,
      status: "pending",
    }));

    const task: TaskLogEntry = {
      id: taskId,
      command,
      result: "",
      status: "working",
      timestamp: now,
      startedAt: now,
      steps,
    };

    this.emit({ type: "command", command });
    this.emit({ type: "status", status: "working", message: "รับทราบครับเจ้านาย! กำลังจัดการให้เลย…" });
    this.emit({ type: "task-start", task });

    let elapsed = 0;
    plan.steps.forEach((planStep, i) => {
      const stepRef = steps[i];

      this.schedule(() => {
        this.emit({
          type: "task-step",
          taskId,
          step: { ...stepRef, status: "running", startedAt: Date.now() },
        });
        this.emit({
          type: "status",
          status: "working",
          message: `${stepRef.label}…`,
        });
      }, elapsed);

      elapsed += planStep.duration;

      this.schedule(() => {
        this.emit({
          type: "task-step",
          taskId,
          step: { ...stepRef, status: "done", completedAt: Date.now() },
        });
      }, elapsed);
    });

    this.schedule(() => {
      this.emit({ type: "task-complete", taskId, result: plan.result });
      this.emit({ type: "status", status: "success", message: plan.result });

      this.schedule(() => {
        this.emit({ type: "status", status: "idle", message: "พร้อมรับงานต่อไปแล้วครับ ☕" });
      }, 2500);
    }, elapsed);
  }

  simulateError(command: string) {
    this.clearTimers();

    const taskId = crypto.randomUUID();
    const now = Date.now();

    const steps: TaskStep[] = [
      { id: crypto.randomUUID(), label: "เริ่มดำเนินการ", status: "pending" },
      { id: crypto.randomUUID(), label: "ประมวลผลคำสั่ง", detail: command, status: "pending" },
      { id: crypto.randomUUID(), label: "ส่งผลลัพธ์", status: "pending" },
    ];

    const task: TaskLogEntry = {
      id: taskId,
      command,
      result: "",
      status: "working",
      timestamp: now,
      startedAt: now,
      steps,
    };

    this.emit({ type: "command", command });
    this.emit({ type: "status", status: "working", message: "กำลังดำเนินการ…" });
    this.emit({ type: "task-start", task });

    this.schedule(() => {
      this.emit({ type: "task-step", taskId, step: { ...steps[0], status: "running", startedAt: Date.now() } });
    }, 0);
    this.schedule(() => {
      this.emit({ type: "task-step", taskId, step: { ...steps[0], status: "done", completedAt: Date.now() } });
      this.emit({ type: "task-step", taskId, step: { ...steps[1], status: "running", startedAt: Date.now() } });
    }, 600);
    this.schedule(() => {
      this.emit({
        type: "task-step",
        taskId,
        step: { ...steps[1], status: "error", completedAt: Date.now(), detail: "Connection timeout" },
      });
      this.emit({ type: "task-error", taskId, error: "เชื่อมต่อ API ไม่ได้ โปรดลองอีกครั้ง 🔴" });
      this.emit({ type: "status", status: "error", message: "เกิดข้อผิดพลาด! เชื่อมต่อไม่ได้ 🔴" });

      this.schedule(() => {
        this.emit({ type: "status", status: "idle", message: "พร้อมรับงานต่อไปแล้วครับ ☕" });
      }, 3000);
    }, 1400);
  }
}

export const hermesService: HermesService = new MockHermesServiceImpl();
