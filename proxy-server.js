import http from "node:http";
import { URL } from "node:url";
import OpenAI from "openai";

const PORT = Number(process.env.PRISM_PROXY_PORT ?? 3001);
const HERMES_URL = process.env.VITE_HERMES_LOCAL_URL ?? "http://localhost:9119";
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
});

let hermesToken = null;
let tokenFetchedAt = 0;

async function getHermesToken() {
  if (hermesToken && Date.now() - tokenFetchedAt < 5 * 60 * 1000) {
    return hermesToken;
  }
  try {
    const res = await fetch(`${HERMES_URL}/`);
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

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function proxyHermes(req, res, targetPath, options = {}) {
  const token = await getHermesToken();
  if (!token) {
    sendJson(res, 503, { error: "Hermes Agent not available" });
    return;
  }

  const body = req.method === "GET" ? undefined : JSON.stringify(await readBody(req));
  const hermesRes = await fetch(`${HERMES_URL}${targetPath}`, {
    method: options.method ?? req.method,
    headers: {
      "Content-Type": "application/json",
      "X-Hermes-Session-Token": token,
    },
    body,
  });
  const text = await hermesRes.text();
  res.writeHead(hermesRes.status, {
    "Content-Type": hermesRes.headers.get("content-type") ?? "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(text);
}

async function handleChat(req, res) {
  if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
    sendJson(res, 503, { error: "OPENROUTER_API_KEY is not configured" });
    return;
  }

  const body = await readBody(req);
  const message = body.message ?? body.prompt ?? "";
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
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
    const error = err instanceof Error ? err.message : "Chat request failed";
    res.write(`data: ${JSON.stringify({ token: `Error: ${error}` })}\n\n`);
    res.write("data: [DONE]\n\n");
  }
  res.end();
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      sendJson(res, 204, {});
      return;
    }

    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const path = url.pathname;

    if (req.method === "POST" && path === "/api/chat") {
      await handleChat(req, res);
      return;
    }

    if (req.method === "GET" && path === "/api/hermes/status") {
      const hermesRes = await fetch(`${HERMES_URL}/api/status`);
      sendJson(res, hermesRes.status, await hermesRes.json());
      return;
    }

    if (req.method === "GET" && path === "/api/hermes/pty-token") {
      const token = await getHermesToken();
      if (!token) sendJson(res, 503, { error: "Hermes Agent not available" });
      else sendJson(res, 200, { token, wsUrl: `ws://localhost:9119/api/pty` });
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
        sendJson(res, 503, { error: "Hermes Agent not available" });
        return;
      }
      const cronsRes = await fetch(`${HERMES_URL}/api/crons`, {
        headers: { "X-Hermes-Session-Token": token },
      }).catch(() => null);
      if (cronsRes?.ok) sendJson(res, cronsRes.status, await cronsRes.json());
      else {
        const statusRes = await fetch(`${HERMES_URL}/api/status`);
        sendJson(res, statusRes.status, await statusRes.json());
      }
      return;
    }
    if (req.method === "POST" && path === "/api/hermes/gateway/restart") {
      await proxyHermes(req, res, "/api/gateway/restart", { method: "POST" });
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    sendJson(res, 500, { error: err instanceof Error ? err.message : "Proxy error" });
  }
});

server.listen(PORT, () => {
  console.log(`Prism proxy listening on http://localhost:${PORT}`);
});
