export type ConnectionMode = "standalone" | "hermes";

export const CONNECTION_MODE_KEY = "prism-connection-mode";
export const PRISM_PROXY_BASE_URL =
  (import.meta.env.VITE_PRISM_PROXY_URL as string | undefined) ?? "http://localhost:3001";

export function getDefaultConnectionMode(): ConnectionMode {
  return import.meta.env.VITE_DEFAULT_CONNECTION_MODE === "hermes" ? "hermes" : "standalone";
}

export function loadConnectionMode(): ConnectionMode {
  if (typeof window === "undefined") return getDefaultConnectionMode();
  const saved = localStorage.getItem(CONNECTION_MODE_KEY);
  if (saved === "hermes" || saved === "standalone") return saved;
  return getDefaultConnectionMode();
}

export function saveConnectionMode(mode: ConnectionMode) {
  localStorage.setItem(CONNECTION_MODE_KEY, mode);
}
