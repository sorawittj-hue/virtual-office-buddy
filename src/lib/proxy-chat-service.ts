import type { HermesEvent } from "./hermes-types";
import type { HermesService, WsConnectionState } from "./ws-hermes-service";
import { PRISM_PROXY_BASE_URL } from "./connection-mode";

export class ProxyChatService implements HermesService {
  private listeners = new Set<(e: HermesEvent) => void>();
  private stateListeners = new Set<(s: WsConnectionState) => void>();
  private destroyed = false;

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
    this.emitState({ status: "connected", url: `${PRISM_PROXY_BASE_URL}/api/chat` });
  }

  disconnect() {
    this.destroyed = true;
    this.emitState({ status: "disconnected", url: `${PRISM_PROXY_BASE_URL}/api/chat` });
  }

  simulateTelegramWebhook(command: string) {
    this.sendChatMessage(command);
  }

  simulateError(command: string) {
    this.sendChatMessage(command);
  }

  async sendChatMessage(content: string) {
    const id = crypto.randomUUID();
    try {
      const res = await fetch(`${PRISM_PROXY_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!this.destroyed) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            this.emit({ type: "chat-stream", id, token: "", done: true });
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content ?? parsed.token ?? "";
            if (token) this.emit({ type: "chat-stream", id, token, done: false });
          } catch {
            if (data) this.emit({ type: "chat-stream", id, token: data, done: false });
          }
        }
      }
      this.emit({ type: "chat-stream", id, token: "", done: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      this.emit({ type: "chat-stream", id, token: `\n\nError: ${message}`, done: false });
      this.emit({ type: "chat-stream", id, token: "", done: true });
    }
  }

  private emit(event: HermesEvent) {
    this.listeners.forEach((listener) => listener(event));
  }

  private emitState(state: WsConnectionState) {
    this.stateListeners.forEach((listener) => listener(state));
  }
}
