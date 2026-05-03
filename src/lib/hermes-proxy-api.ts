import { PRISM_PROXY_BASE_URL } from "./connection-mode";
import { proxyHeaders } from "./proxy-auth";

export interface HermesGatewayStatus {
  gateway_platforms?: {
    telegram?: {
      state?: string;
      connected?: boolean;
      status?: string;
    };
  };
  platforms?: Record<string, { connected?: boolean; status?: string; state?: string }>;
  crons?: unknown[];
  cron?: unknown;
  jobs?: unknown[];
}

export interface HermesSession {
  id: string;
  name?: string;
  title?: string;
  message_count?: number;
  messageCount?: number;
  messages?: unknown[];
  last_active_at?: string | number;
  lastActiveAt?: string | number;
  updated_at?: string | number;
  created_at?: string | number;
}

export interface HermesCron {
  id?: string;
  name?: string;
  schedule?: string;
  cron?: string;
  prompt?: string;
  command?: string;
  enabled?: boolean;
  last_run?: string | number;
}

export interface HermesMemoryEntry {
  id?: string;
  key?: string;
  value?: string;
  content?: string;
  category?: string;
  updated_at?: string | number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${PRISM_PROXY_BASE_URL}${path}`, {
    ...init,
    headers: proxyHeaders(init?.headers),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

function arrayFrom<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>)[key])) {
    return (data as Record<string, unknown>)[key] as T[];
  }
  return [];
}

export const hermesProxyApi = {
  status: () => request<HermesGatewayStatus>("/api/hermes/status"),
  sessions: async () => arrayFrom<HermesSession>(await request("/api/hermes/sessions"), "sessions"),
  memory: async () => arrayFrom<HermesMemoryEntry>(await request("/api/hermes/memory"), "memory"),
  crons: async () => arrayFrom<HermesCron>(await request("/api/hermes/crons"), "crons"),
  ptyToken: () => request<{ token: string; wsUrl: string }>("/api/hermes/pty-token"),
};

export function getTelegramState(status: HermesGatewayStatus | null): "connected" | "disconnected" {
  const telegram = status?.gateway_platforms?.telegram ?? status?.platforms?.telegram;
  if (!telegram) return "disconnected";
  if (telegram.state === "connected" || telegram.connected || telegram.status === "connected") {
    return "connected";
  }
  return "disconnected";
}
