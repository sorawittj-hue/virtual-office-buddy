const proxyAuthToken = import.meta.env.VITE_PRISM_PROXY_AUTH_TOKEN as string | undefined;

export function proxyHeaders(headers?: HeadersInit): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(proxyAuthToken ? { Authorization: `Bearer ${proxyAuthToken}` } : {}),
    ...(headers ?? {}),
  };
}
