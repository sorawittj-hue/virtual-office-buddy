import http from "node:http";
import { URL } from "node:url";
import OpenAI from "openai";
import {
  HttpError,
  createRateLimiter,
  getCorsOrigin,
  parseAllowedOrigins,
  parsePositiveInteger,
  parseUrl,
  readJsonBody,
  validateChatInput,
} from "./server-utils.js";

const DEFAULT_DEV_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const isProduction = process.env.NODE_ENV === "production";

function loadConfig() {
  const port = parsePositiveInteger(process.env.PRISM_PROXY_PORT, 3001, "PRISM_PROXY_PORT", {
    min: 1,
    max: 65535,
  });
  const hermesUrl = parseUrl(
    process.env.VITE_HERMES_LOCAL_URL,
    "http://localhost:9119",
    "VITE_HERMES_LOCAL_URL",
  );
  const maxBodyBytes = parsePositiveInteger(
    process.env.PRISM_MAX_BODY_BYTES,
    1_048_576,
    "PRISM_MAX_BODY_BYTES",
    { min: 1_024, max: 10_485_760 },
  );
  const rateLimitPerMinute = parsePositiveInteger(
    process.env.PRISM_RATE_LIMIT_PER_MIN,
    30,
    "PRISM_RATE_LIMIT_PER_MIN",
    { min: 1, max: 10_000 },
  );
  const allowedOrigins = parseAllowedOrigins(
    process.env.PRISM_ALLOWED_ORIGINS,
    DEFAULT_DEV_ORIGINS,
  );
  const proxySecret = process.env.PRISM_PROXY_SECRET ?? "";
  const browserProxyToken = process.env.PRISM_BROWSER_PROXY_TOKEN ?? "";

  if (isProduction && !proxySecret && !browserProxyToken) {
    throw new Error(
      "PRISM_PROXY_SECRET or PRISM_BROWSER_PROXY_TOKEN is required when NODE_ENV=production",
    );
  }
  if (isProduction && proxySecret && proxySecret.length < 24) {
    throw new Error("PRISM_PROXY_SECRET must be at least 24 characters in production");
  }
  if (isProduction && browserProxyToken && browserProxyToken.length < 24) {
    throw new Error("PRISM_BROWSER_PROXY_TOKEN must be at least 24 characters in production");
  }
  if (isProduction && allowedOrigins.includes("*") && process.env.PRISM_ALLOWED_ORIGINS !== "*") {
    throw new Error('Wildcard CORS requires PRISM_ALLOWED_ORIGINS="*" explicitly');
  }

  return {
    port,
    hermesUrl,
    maxBodyBytes,
    rateLimitPerMinute,
    allowedOrigins,
    proxySecret,
    browserProxyToken,
  };
}

let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(`Virtual Office Buddy proxy startup failed: ${err.message}`);
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
});

const checkChatRateLimit = createRateLimiter(config.rateLimitPerMinute);
let hermesToken = null;
let tokenFetchedAt = 0;

async function getHermesToken() {
  if (hermesToken && Date.now() - tokenFetchedAt < 5 * 60 * 1000) {
    return hermesToken;
  }
  try {
    const res = await fetch(`${config.hermesUrl}/`);
    const html = await res.text();
    const match =
      html.match(/HERMES_SESSION_TOKEN__\s*=\s*"([^"]+)"/) ??
      html.match(/HERMES_SESSION_TOKEN__="([^"]+)"/);
    if (match) {
      hermesToken = match[1];
      tokenFetchedAt = Date.now();
    }
  } catch {
    // Hermes is optional in standalone mode.
  }
  return hermesToken;
}

function corsHeaders(req) {
  const origin = getCorsOrigin(req.headers.origin, config.allowedOrigins);
  if (!origin) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    Vary: "Origin",
  };
}

function sendJson(req, res, status, body) {
  const headers = corsHeaders(req);
  if (!headers) {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Origin not allowed" }));
    return;
  }
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(status === 204 ? "" : JSON.stringify(body));
}

function sendError(req, res, status, message) {
  sendJson(req, res, status, { error: message });
}

function safeErrorMessage(err, fallback) {
  if (!isProduction && err instanceof Error) return err.message;
  return fallback;
}

function requireAuth(req) {
  const acceptedTokens = [config.proxySecret, config.browserProxyToken].filter(Boolean);
  if (acceptedTokens.length === 0) return;
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!acceptedTokens.includes(token)) {
    throw new HttpError(401, "Unauthorized");
  }
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress ?? "unknown";
}

async function readBody(req) {
  return readJsonBody(req, config.maxBodyBytes);
}

async function proxyHermes(req, res, targetPath, options = {}) {
  const token = await getHermesToken();
  if (!token) {
    sendJson(req, res, 503, { error: "Hermes Agent not available" });
    return;
  }

  const body = req.method === "GET" ? undefined : JSON.stringify(await readBody(req));
  const hermesRes = await fetch(`${config.hermesUrl}${targetPath}`, {
    method: options.method ?? req.method,
    headers: {
      "Content-Type": "application/json",
      "X-Hermes-Session-Token": token,
    },
    body,
  });
  const text = await hermesRes.text();
  const headers = corsHeaders(req);
  if (!headers) {
    sendError(req, res, 403, "Origin not allowed");
    return;
  }
  res.writeHead(hermesRes.status, {
    "Content-Type": hermesRes.headers.get("content-type") ?? "application/json",
    ...headers,
  });
  res.end(text);
}

async function handleChat(req, res) {
  if (!checkChatRateLimit(clientIp(req))) {
    sendJson(req, res, 429, { error: "Rate limit exceeded" });
    return;
  }
  if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
    sendJson(req, res, 503, { error: "OPENROUTER_API_KEY or OPENAI_API_KEY is not configured" });
    return;
  }

  const body = await readBody(req);
  validateChatInput(body);

  const headers = corsHeaders(req);
  if (!headers) {
    sendError(req, res, 403, "Origin not allowed");
    return;
  }

  const message = body.message ?? body.prompt ?? "";
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    ...headers,
  });

  try {
    const stream = await openai.chat.completions.create({
      model:
        body.model ?? process.env.OPENROUTER_MODEL ?? "nousresearch/hermes-3-llama-3.1-405b:free",
      messages: body.messages ?? [{ role: "user", content: message }],
      stream: true,
    });
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    res.write("data: [DONE]\n\n");
  } catch (err) {
    console.error("Chat request failed", err);
    const error = safeErrorMessage(err, "Chat request failed");
    res.write(`data: ${JSON.stringify({ token: `Error: ${error}` })}\n\n`);
    res.write("data: [DONE]\n\n");
  }
  res.end();
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      sendJson(req, res, 204, {});
      return;
    }

    requireAuth(req);

    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const path = url.pathname;

    if (req.method === "POST" && path === "/api/chat") {
      await handleChat(req, res);
      return;
    }

    if (req.method === "GET" && path === "/api/hermes/status") {
      const hermesRes = await fetch(`${config.hermesUrl}/api/status`);
      sendJson(req, res, hermesRes.status, await hermesRes.json());
      return;
    }

    if (req.method === "GET" && path === "/api/hermes/pty-token") {
      const token = await getHermesToken();
      if (!token) sendJson(req, res, 503, { error: "Hermes Agent not available" });
      else sendJson(req, res, 200, { token, wsUrl: `ws://localhost:9119/api/pty` });
      return;
    }

    if (req.method === "GET" && path === "/api/hermes/sessions") {
      await proxyHermes(req, res, "/api/sessions");
      return;
    }
    if (req.method === "GET" && path.startsWith("/api/hermes/session/")) {
      await proxyHermes(
        req,
        res,
        `/api/sessions/${encodeURIComponent(path.split("/").pop() ?? "")}`,
      );
      return;
    }
    if (req.method === "GET" && path === "/api/hermes/config") {
      await proxyHermes(req, res, "/api/config");
      return;
    }
    if (req.method === "PUT" && path === "/api/hermes/config") {
      await proxyHermes(req, res, "/api/config", { method: "PUT" });
      return;
    }
    if (req.method === "GET" && path === "/api/hermes/memory") {
      await proxyHermes(req, res, "/api/memory");
      return;
    }
    if (req.method === "GET" && path === "/api/hermes/crons") {
      const token = await getHermesToken();
      if (!token) {
        sendJson(req, res, 503, { error: "Hermes Agent not available" });
        return;
      }
      const cronsRes = await fetch(`${config.hermesUrl}/api/crons`, {
        headers: { "X-Hermes-Session-Token": token },
      }).catch(() => null);
      if (cronsRes?.ok) sendJson(req, res, cronsRes.status, await cronsRes.json());
      else {
        const statusRes = await fetch(`${config.hermesUrl}/api/status`);
        sendJson(req, res, statusRes.status, await statusRes.json());
      }
      return;
    }
    if (req.method === "POST" && path === "/api/hermes/gateway/restart") {
      await proxyHermes(req, res, "/api/gateway/restart", { method: "POST" });
      return;
    }

    sendJson(req, res, 404, { error: "Not found" });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message =
      err instanceof HttpError ? err.message : safeErrorMessage(err, "Proxy request failed");
    if (status >= 500) console.error("Proxy request failed", err);
    sendError(req, res, status, message);
  }
});

server.listen(config.port, () => {
  console.log(`Virtual Office Buddy proxy listening on http://localhost:${config.port}`);
  console.log(`Allowed origins: ${config.allowedOrigins.join(", ")}`);
});
