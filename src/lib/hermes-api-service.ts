import type { HermesEvent } from "./hermes-types";
import type { HermesService, ConnectionStatus, WsConnectionState } from "./ws-hermes-service";

export interface HermesHealthDetail {
  status: string;
  uptime?: number;
  model?: string;
  llm_model?: string;
  platforms?: Record<string, { connected?: boolean; status?: string }>;
  version?: string;
}

export interface HermesJobConfig {
  id?: string;
  name: string;
  schedule: string;
  prompt: string;
  enabled: boolean;
  platform?: string;
}

export class HermesApiService implements HermesService {
  private listeners = new Set<(e: HermesEvent) => void>();
  private stateListeners = new Set<(s: WsConnectionState) => void>();
  private healthTimer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;
  private sessionId = crypto.randomUUID();

  constructor(
    public readonly baseUrl: string,
    private apiKey?: string,
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
    this.emitState({ status: "connecting", url: this.baseUrl });
    this.checkHealth().then(() => {
      if (!this.destroyed) {
        this.healthTimer = setInterval(() => this.checkHealth(), 20_000);
      }
    });
  }

  disconnect() {
    this.destroyed = true;
    if (this.healthTimer) clearInterval(this.healthTimer);
    this.healthTimer = null;
    this.emitState({ status: "disconnected", url: this.baseUrl });
  }

  simulateTelegramWebhook(command: string) {
    this.sendChatMessage(command);
  }

  simulateError(command: string) {
    this.sendChatMessage(command);
  }

  async sendChatMessage(content: string) {
    const msgId = crypto.randomUUID();
    try {
      const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
          "X-Hermes-Session-Id": this.sessionId,
        },
        body: JSON.stringify({
          model: "hermes",
          messages: [{ role: "user", content }],
          stream: true,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            this.emit({ type: "chat-stream", id: msgId, token: "", done: true });
            return;
          }
          try {
            const chunk = JSON.parse(data);
            const token = chunk.choices?.[0]?.delta?.content ?? "";
            if (token) this.emit({ type: "chat-stream", id: msgId, token, done: false });
          } catch {
            /* skip malformed SSE chunks */
          }
        }
      }
      this.emit({ type: "chat-stream", id: msgId, token: "", done: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      this.emit({ type: "chat-stream", id: msgId, token: `\n\n❌ **Error:** ${msg}`, done: false });
      this.emit({ type: "chat-stream", id: msgId, token: "", done: true });
    }
  }

  private async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
        signal: AbortSignal.timeout(5_000),
      });
      if (res.ok) {
        this.emitState({ status: "connected", url: this.baseUrl });
        this.emit({ type: "status", status: "idle" });
      } else {
        this.emitState({ status: "error", url: this.baseUrl, error: `HTTP ${res.status}` });
      }
    } catch {
      if (!this.destroyed) {
        this.emitState({
          status: "error",
          url: this.baseUrl,
          error: "ไม่สามารถเชื่อมต่อ Hermes API",
        });
      }
    }
  }

  private emit(event: HermesEvent) {
    this.listeners.forEach((l) => l(event));
  }

  private emitState(state: WsConnectionState) {
    this.stateListeners.forEach((l) => l(state));
  }

  private get headers(): HeadersInit {
    return {
      "Content-Type": "application/json",
      ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
    };
  }

  async fetchHealth(): Promise<HermesHealthDetail> {
    const res = await fetch(`${this.baseUrl}/health/detailed`, {
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
    });
    return res.json();
  }

  async fetchModels(): Promise<{ id: string; owned_by?: string }[]> {
    const res = await fetch(`${this.baseUrl}/v1/models`, {
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
    });
    const data = await res.json();
    return data.data ?? [];
  }

  async fetchJobs(): Promise<HermesJobConfig[]> {
    const res = await fetch(`${this.baseUrl}/api/jobs`, {
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
    });
    return res.json();
  }

  async createJob(job: Omit<HermesJobConfig, "id">): Promise<HermesJobConfig> {
    const res = await fetch(`${this.baseUrl}/api/jobs`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(job),
    });
    return res.json();
  }

  async updateJob(id: string, patch: Partial<HermesJobConfig>): Promise<HermesJobConfig> {
    const res = await fetch(`${this.baseUrl}/api/jobs/${id}`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify(patch),
    });
    return res.json();
  }

  async deleteJob(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/jobs/${id}`, {
      method: "DELETE",
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
    });
  }

  async runJob(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/jobs/${id}/run`, {
      method: "POST",
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
    });
  }

  async fetchPlatforms(): Promise<Record<string, { connected: boolean; status?: string }>> {
    try {
      const res = await fetch(`${this.baseUrl}/health/detailed`, {
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
      });
      const data = await res.json();
      return data.platforms ?? {};
    } catch {
      return {};
    }
  }

  async switchModel(modelId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: "system", content: `/model ${modelId}` }],
          stream: false,
          max_tokens: 1,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // ─── Kanban ─────────────────────────────────────────────────────────────────

  async fetchKanbanTasks(params?: {
    status?: string;
    assignee?: string;
    tenant?: string;
  }): Promise<import("./kanban").HermesKanbanTask[]> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.assignee) qs.set("assignee", params.assignee);
    if (params?.tenant) qs.set("tenant", params.tenant);
    const res = await fetch(`${this.baseUrl}/api/kanban/tasks?${qs}`, {
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json();
    return Array.isArray(data) ? data : (data.tasks ?? []);
  }

  async createKanbanTask(body: {
    title: string;
    body?: string;
    assignee?: string;
    priority?: number;
    tenant?: string;
    parent_id?: string;
    triage?: boolean;
  }): Promise<import("./kanban").HermesKanbanTask> {
    const res = await fetch(`${this.baseUrl}/api/kanban/tasks`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    return res.json();
  }

  async updateKanbanTask(
    id: string,
    patch: {
      status?: string;
      assignee?: string;
      priority?: number;
      title?: string;
      body?: string;
    },
  ): Promise<import("./kanban").HermesKanbanTask> {
    const res = await fetch(`${this.baseUrl}/api/kanban/tasks/${id}`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify(patch),
      signal: AbortSignal.timeout(10_000),
    });
    return res.json();
  }

  async commentKanbanTask(id: string, comment: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/kanban/tasks/${id}/comments`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ body: comment }),
      signal: AbortSignal.timeout(10_000),
    });
  }

  async completeKanbanTask(id: string, result: string, summary?: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/kanban/tasks/${id}/complete`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ result, summary }),
      signal: AbortSignal.timeout(10_000),
    });
  }

  async blockKanbanTask(id: string, reason: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/kanban/tasks/${id}/block`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ reason }),
      signal: AbortSignal.timeout(10_000),
    });
  }

  async unblockKanbanTask(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/kanban/tasks/${id}/unblock`, {
      method: "POST",
      headers: this.headers,
      signal: AbortSignal.timeout(10_000),
    });
  }

  async archiveKanbanTask(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/kanban/tasks/${id}/archive`, {
      method: "POST",
      headers: this.headers,
      signal: AbortSignal.timeout(10_000),
    });
  }
}

export async function testProviderConnection(
  baseUrl: string,
  apiKey?: string,
  modelId?: string,
): Promise<{ ok: boolean; latency: number; error?: string }> {
  const start = Date.now();
  try {
    const url = `${baseUrl.replace(/\/$/, "")}/models`;
    const res = await fetch(url, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: AbortSignal.timeout(8_000),
    });
    if (res.ok) return { ok: true, latency: Date.now() - start };
    return { ok: false, latency: Date.now() - start, error: `HTTP ${res.status}` };
  } catch (err) {
    return {
      ok: false,
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown",
    };
  }
}
