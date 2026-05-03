export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function parsePositiveInteger(
  value,
  fallback,
  name,
  { min = 1, max = Number.MAX_SAFE_INTEGER } = {},
) {
  if (value == null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}

export function parseUrl(value, fallback, name) {
  const candidate = value || fallback;
  try {
    return new URL(candidate).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
}

export function parseAllowedOrigins(value, defaults) {
  const raw = value == null || value.trim() === "" ? defaults.join(",") : value;
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getCorsOrigin(requestOrigin, allowedOrigins) {
  if (!requestOrigin) return allowedOrigins[0] ?? "null";
  if (allowedOrigins.includes("*")) return "*";
  return allowedOrigins.includes(requestOrigin) ? requestOrigin : null;
}

export async function readJsonBody(req, maxBytes) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      throw new HttpError(413, "Payload too large");
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
}

export function createRateLimiter(limitPerMinute) {
  const buckets = new Map();
  return function checkRateLimit(key) {
    const now = Date.now();
    const id = String(key || "unknown");
    let bucket = buckets.get(id) ?? { count: 0, resetAt: now + 60_000 };
    if (now > bucket.resetAt) bucket = { count: 0, resetAt: now + 60_000 };
    if (bucket.count >= limitPerMinute) {
      buckets.set(id, bucket);
      return false;
    }
    bucket.count += 1;
    buckets.set(id, bucket);
    return true;
  };
}

export function validateChatInput(body) {
  const hasMessages = Array.isArray(body.messages) && body.messages.length > 0;
  const hasMessage = typeof body.message === "string" && body.message.trim().length > 0;
  const hasPrompt = typeof body.prompt === "string" && body.prompt.trim().length > 0;
  if (!hasMessages && !hasMessage && !hasPrompt) {
    throw new HttpError(400, "message, prompt, or messages is required");
  }
  if (typeof body.model !== "undefined" && typeof body.model !== "string") {
    throw new HttpError(400, "model must be a string");
  }
  if (hasMessage && body.message.length > 20_000) {
    throw new HttpError(400, "message is too long");
  }
  if (hasPrompt && body.prompt.length > 20_000) {
    throw new HttpError(400, "prompt is too long");
  }
  if (hasMessages) {
    for (const message of body.messages) {
      if (
        !message ||
        typeof message !== "object" ||
        typeof message.role !== "string" ||
        typeof message.content !== "string" ||
        message.content.length > 20_000
      ) {
        throw new HttpError(400, "messages must contain role/content strings");
      }
    }
  }
}

export function escapeTelegramHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function simulatedResult(text) {
  return `Simulated only: ${text}`;
}
