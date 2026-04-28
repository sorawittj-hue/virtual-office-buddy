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
  "Send Email": {
    steps: [
      { label: "Parsing recipient & intent", duration: 600 },
      { label: "Drafting email body", detail: "Using friendly tone", duration: 900 },
      { label: "Reviewing for typos", duration: 500 },
      { label: "Sending via SMTP", detail: "to inbox@example.com", duration: 700 },
    ],
    result: "Email sent! 📬 Drafted, polished, and delivered.",
  },
  "Search Data": {
    steps: [
      { label: "Connecting to data sources", duration: 500 },
      { label: "Running query", detail: "3 indexes scanned", duration: 800 },
      { label: "Ranking 12 results", duration: 600 },
      { label: "Summarizing findings", duration: 700 },
    ],
    result: "Found 12 relevant records and summarized them for you.",
  },
  "Schedule Meeting": {
    steps: [
      { label: "Checking calendar availability", duration: 700 },
      { label: "Finding common slot", detail: "3 attendees", duration: 700 },
      { label: "Booking room", duration: 500 },
      { label: "Sending invites", duration: 600 },
    ],
    result: "Meeting booked for tomorrow at 3:00 PM ✅",
  },
  "Generate Report": {
    steps: [
      { label: "Pulling Q-data from warehouse", duration: 700 },
      { label: "Crunching metrics", duration: 900 },
      { label: "Rendering charts", duration: 700 },
      { label: "Saving PDF to Drive", duration: 600 },
    ],
    result: "Quarterly report generated and saved to Drive.",
  },
};

const defaultPlan = (command: string): CommandPlan => ({
  steps: [
    { label: "Understanding request", duration: 600 },
    { label: "Working on it", detail: command, duration: 1200 },
    { label: "Wrapping up", duration: 600 },
  ],
  result: `Done! Completed: "${command}"`,
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
    this.emit({ type: "status", status: "working", message: "On it, Boss! Working on this now…" });
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
        this.emit({ type: "status", status: "idle", message: "Ready for the next task ☕" });
      }, 2500);
    }, elapsed);
  }
}

export const hermesService: HermesService = new MockHermesServiceImpl();
