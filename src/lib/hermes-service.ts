/**
 * Hermes service: mock implementation.
 *
 * Swap `MockHermesService` with a WebSocket / API client later.
 * Anything implementing `HermesService` will plug into the UI without changes.
 */
import type { HermesEvent, TaskLogEntry } from "./hermes-types";

export interface HermesService {
  subscribe(listener: (event: HermesEvent) => void): () => void;
  /** Simulate an incoming Telegram command (mock) */
  simulateTelegramWebhook(command: string, resultMessage?: string): void;
}

const friendlyResults: Record<string, string> = {
  "Send Email": "Email sent! 📬 Drafted, polished, and delivered.",
  "Search Data": "Found 12 relevant records and summarized them for you.",
  "Schedule Meeting": "Meeting booked for tomorrow at 3:00 PM ✅",
  "Generate Report": "Quarterly report generated and saved to Drive.",
};

class MockHermesServiceImpl implements HermesService {
  private listeners = new Set<(e: HermesEvent) => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;

  subscribe(listener: (e: HermesEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: HermesEvent) {
    this.listeners.forEach((l) => l(event));
  }

  simulateTelegramWebhook(command: string, resultMessage?: string) {
    if (this.timer) clearTimeout(this.timer);

    this.emit({ type: "command", command });
    this.emit({ type: "status", status: "working", message: "On it, Boss! Working on this now…" });

    this.timer = setTimeout(() => {
      const result =
        resultMessage ?? friendlyResults[command] ?? `Done! Completed: "${command}"`;
      this.emit({ type: "status", status: "success", message: result });

      const entry: TaskLogEntry = {
        id: crypto.randomUUID(),
        command,
        result,
        status: "success",
        timestamp: Date.now(),
      };
      this.emit({ type: "log", entry });

      // Drift back to idle after celebrating
      this.timer = setTimeout(() => {
        this.emit({ type: "status", status: "idle", message: "Ready for the next task ☕" });
      }, 2500);
    }, 3000);
  }
}

export const hermesService: HermesService = new MockHermesServiceImpl();
