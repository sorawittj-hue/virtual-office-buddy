export type HermesStatus = "idle" | "working" | "success";

export interface TaskLogEntry {
  id: string;
  command: string;
  result: string;
  status: "working" | "success" | "error";
  timestamp: number;
}

export interface HermesState {
  status: HermesStatus;
  bossMessage: string | null;
  hermesMessage: string;
  connection: "online" | "offline" | "reconnecting";
  channel: string; // e.g. "Telegram"
  log: TaskLogEntry[];
}

export type HermesEvent =
  | { type: "command"; command: string }
  | { type: "status"; status: HermesStatus; message?: string }
  | { type: "log"; entry: TaskLogEntry };
