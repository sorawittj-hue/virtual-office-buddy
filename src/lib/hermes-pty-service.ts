import type { HermesEvent } from "./hermes-types";
import type { HermesService, WsConnectionState } from "./ws-hermes-service";
import { hermesProxyApi } from "./hermes-proxy-api";
import Convert from "ansi-to-html";

const ANSI_RE =
  // eslint-disable-next-line no-control-regex
  /[\u001b\u009b][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g;
const ansiConverter = new Convert({ newline: true, escapeXML: true });

function terminalText(value: string): string {
  const html = ansiConverter.toHtml(value);
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(ANSI_RE, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

function extractPayload(data: MessageEvent["data"]): string {
  if (typeof data !== "string") return "";
  try {
    const parsed = JSON.parse(data);
    return parsed.data ?? parsed.output ?? parsed.text ?? parsed.token ?? "";
  } catch {
    return data;
  }
}

export class HermesPtyService implements HermesService {
  private ws: WebSocket | null = null;
  private listeners = new Set<(e: HermesEvent) => void>();
  private stateListeners = new Set<(s: WsConnectionState) => void>();
  private destroyed = false;
  private activeMessageId: string | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private wsUrl = "";

  subscribeState(listener: (s: WsConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  subscribe(listener: (e: HermesEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async connect() {
    this.destroyed = false;
    this.emitState({ status: "connecting", url: "Hermes PTY" });
    try {
      const { token, wsUrl } = await hermesProxyApi.ptyToken();
      this.wsUrl = wsUrl;
      const url = `${wsUrl}${wsUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(url);
      this.ws.onopen = () => this.emitState({ status: "connected", url: wsUrl });
      this.ws.onclose = () => {
        this.finishActiveMessage();
        if (!this.destroyed) this.emitState({ status: "disconnected", url: wsUrl });
      };
      this.ws.onerror = () => this.emitState({ status: "error", url: wsUrl, error: "PTY failed" });
      this.ws.onmessage = (event) => {
        const tokenText = terminalText(extractPayload(event.data));
        if (!tokenText.trim()) return;
        if (!this.activeMessageId) this.activeMessageId = crypto.randomUUID();
        this.emit({ type: "chat-stream", id: this.activeMessageId, token: tokenText, done: false });
        this.scheduleIdleFinish();
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Hermes Agent not available";
      this.emitState({ status: "error", url: this.wsUrl || "Hermes PTY", error });
    }
  }

  disconnect() {
    this.destroyed = true;
    this.finishActiveMessage();
    this.ws?.close();
    this.ws = null;
    this.emitState({ status: "disconnected", url: this.wsUrl || "Hermes PTY" });
  }

  simulateTelegramWebhook(command: string) {
    this.sendChatMessage(command);
  }

  simulateError(command: string) {
    this.sendChatMessage(command);
  }

  sendChatMessage(content: string) {
    this.activeMessageId = crypto.randomUUID();
    if (this.ws?.readyState !== WebSocket.OPEN) {
      this.emit({
        type: "chat-stream",
        id: this.activeMessageId,
        token: "Hermes PTY is not connected.",
        done: false,
      });
      this.finishActiveMessage();
      return;
    }
    this.ws.send(JSON.stringify({ type: "input", data: `${content}\n` }));
  }

  private scheduleIdleFinish() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.finishActiveMessage(), 500);
  }

  private finishActiveMessage() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    if (this.activeMessageId) {
      this.emit({ type: "chat-stream", id: this.activeMessageId, token: "", done: true });
      this.activeMessageId = null;
    }
  }

  private emit(event: HermesEvent) {
    this.listeners.forEach((listener) => listener(event));
  }

  private emitState(state: WsConnectionState) {
    this.stateListeners.forEach((listener) => listener(state));
  }
}
