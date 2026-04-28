export type HermesStatus = "idle" | "working" | "success";

export type StepStatus = "pending" | "running" | "done" | "error";

export interface TaskStep {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface TaskLogEntry {
  id: string;
  command: string;
  result: string;
  status: "working" | "success" | "error";
  timestamp: number;
  startedAt: number;
  steps: TaskStep[];
}

export interface HermesState {
  status: HermesStatus;
  bossMessage: string | null;
  hermesMessage: string;
  connection: "online" | "offline" | "reconnecting";
  channel: string; // e.g. "Telegram"
  log: TaskLogEntry[];
  /** The task currently being executed, with live-updating steps. Null when idle. */
  activeTask: TaskLogEntry | null;
}

export type HermesEvent =
  | { type: "command"; command: string }
  | { type: "status"; status: HermesStatus; message?: string }
  | { type: "task-start"; task: TaskLogEntry }
  | {
      type: "task-step";
      taskId: string;
      step: TaskStep;
    }
  | { type: "task-complete"; taskId: string; result: string }
  | { type: "log"; entry: TaskLogEntry };
