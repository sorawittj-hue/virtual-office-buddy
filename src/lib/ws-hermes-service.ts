import type { HermesEvent, TaskLogEntry, TaskStep } from "./hermes-types";

export interface HermesService {
  subscribe(listener: (event: HermesEvent) => void): () => void;
  simulateTelegramWebhook(command: string): void;
  simulateError(command: string): void;
  sendChatMessage?(content: string): void;
  fetchHealth?(): Promise<{
    model?: string;
    llm_model?: string;
    uptime?: number;
    platforms?: Record<string, { connected?: boolean; status?: string }>;
    version?: string;
  }>;
  fetchPlatforms?(): Promise<Record<string, { connected: boolean; status?: string }>>;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface WsConnectionState {
  status: ConnectionStatus;
  url: string;
  error?: string;
  latency?: number;
}

export class WebSocketHermesService implements HermesService {
  private ws: WebSocket | null = null;
  private listeners = new Set<(e: HermesEvent) => void>();
  private stateListeners = new Set<(s: WsConnectionState) => void>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pingAt = 0;
  private reconnectDelay = 2000;
  private destroyed = false;

  constructor(
    private url: string,
    private token?: string,
  ) {}

  subscribeState(listener: (s: WsConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  subscribe(listener: (e: HermesEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  connect() {
    this.destroyed = false;
    this.emitState({ status: "connecting", url: this.url });
    try {
      const fullUrl = this.token
        ? `${this.url}${this.url.includes("?") ? "&" : "?"}token=${encodeURIComponent(this.token)}`
        : this.url;
      this.ws = new WebSocket(fullUrl);
    } catch {
      this.emitState({ status: "error", url: this.url, error: "Invalid URL" });
      return;
    }

    this.ws.onopen = () => {
      this.reconnectDelay = 2000;
      this.emitState({ status: "connected", url: this.url });
      this.startPing();
    };

    this.ws.onclose = () => {
      this.stopPing();
      if (!this.destroyed) {
        this.emitState({ status: "disconnected", url: this.url });
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.emitState({ status: "error", url: this.url, error: "Connection failed" });
    };

    this.ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as HermesEvent;
        this.listeners.forEach((l) => l(event));
      } catch {
        /* ignore malformed messages */
      }
    };
  }

  disconnect() {
    this.destroyed = true;
    this.stopPing();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.emitState({ status: "disconnected", url: this.url });
  }

  simulateTelegramWebhook(command: string) {
    this.send({ type: "command", command });
  }

  simulateError(command: string) {
    this.send({ type: "command", command, _forceError: true });
  }

  sendChatMessage(content: string) {
    this.send({ type: "chat-message", content });
  }

  private send(payload: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private startPing() {
    this.pingTimer = setInterval(() => {
      this.pingAt = Date.now();
      this.send({ type: "ping" });
    }, 30_000);
  }

  private stopPing() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
  }

  private scheduleReconnect() {
    this.reconnectTimer = setTimeout(() => {
      if (!this.destroyed) {
        this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30_000);
        this.connect();
      }
    }, this.reconnectDelay);
  }

  private emitState(state: WsConnectionState) {
    this.stateListeners.forEach((l) => l(state));
  }
}
