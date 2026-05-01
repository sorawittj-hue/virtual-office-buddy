export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH";

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  description: string;
  payloadTemplate: string;
  enabled: boolean;
  createdAt: number;
  lastTriggeredAt?: number;
  lastStatus?: number;
  lastOk?: boolean;
}

export interface TriggerResult {
  ok: boolean;
  status: number;
  body: string;
  durationMs: number;
}

const STORAGE_KEY = "prism-webhooks";

export const DEFAULT_PAYLOAD = `{
  "prompt": "{{prompt}}",
  "source": "prism",
  "timestamp": "{{timestamp}}"
}`;

// ─── Storage ──────────────────────────────────────────────────────────────────

export function loadWebhooks(): WebhookConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveWebhooks(webhooks: WebhookConfig[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(webhooks)); } catch { /* ignore */ }
}

// ─── Trigger ──────────────────────────────────────────────────────────────────

export async function triggerWebhook(
  webhook: WebhookConfig,
  prompt = ""
): Promise<TriggerResult> {
  const body = webhook.payloadTemplate
    .replace(/\{\{prompt\}\}/g, prompt)
    .replace(/\{\{timestamp\}\}/g, new Date().toISOString())
    .replace(/\{\{name\}\}/g, webhook.name);

  const start = Date.now();
  try {
    const res = await fetch(webhook.url, {
      method: webhook.method,
      headers: { "Content-Type": "application/json" },
      body: webhook.method !== "GET" ? body : undefined,
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, body: text, durationMs: Date.now() - start };
  } catch (err: any) {
    return { ok: false, status: 0, body: err?.message ?? "Network error", durationMs: Date.now() - start };
  }
}
