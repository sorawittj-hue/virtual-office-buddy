/**
 * Hermes service: mock implementation.
 *
 * Swap `MockHermesServiceImpl` with a WebSocket / API client later.
 * Anything implementing `HermesService` will plug into the UI without changes.
 *
 * Streaming model:
 *  - emit `task-start` with the full step list (all `pending`) the moment a
 *    command arrives. The UI shows the steps immediately.
 *  - emit `task-step` updates as each step transitions to `running`, then `done`.
 *    The UI can render a live progress feed.
 *  - emit `task-complete` + `log` once the final step finishes.
 */
import type { HermesEvent, TaskLogEntry, TaskStep } from "./hermes-types";

export interface HermesService {
  subscribe(listener: (event: HermesEvent) => void): () => void;
  /** Simulate an incoming Telegram command (mock) */
  simulateTelegramWebhook(command: string): void;
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

    // Stream each step: running -> done
    let elapsed = 0;
    plan.steps.forEach((planStep, i) => {
      const stepRef = steps[i];

      // Mark running at the start of this step
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

      // Mark done at the end of this step
      this.schedule(() => {
        this.emit({
          type: "task-step",
          taskId,
          step: { ...stepRef, status: "done", completedAt: Date.now() },
        });
      }, elapsed);
    });

    // Finalize
    this.schedule(() => {
      this.emit({ type: "task-complete", taskId, result: plan.result });
      this.emit({ type: "status", status: "success", message: plan.result });

      this.schedule(() => {
        this.emit({ type: "status", status: "idle", message: "พร้อมรับงานต่อไปแล้วครับ ☕" });
      }, 2500);
    }, elapsed);
  }
}

export const hermesService: HermesService = new MockHermesServiceImpl();
