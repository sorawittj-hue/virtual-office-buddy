# Security

## Baseline

- Keep `proxy-server.js` and `telegram-bridge.js` private unless protected by authentication.
- Treat client-side guardrails as advisory UX checks, not a security boundary.
- Store API keys, Telegram bot tokens, WebSocket secrets, and Hermes endpoints outside source control.
- Use exact `PRISM_ALLOWED_ORIGINS` values in production.
- Set `PRISM_PROXY_SECRET`, `WS_SECRET`, and `ALLOWED_CHAT_IDS` for production-like runs.

## Proxy

The proxy enforces allowlisted CORS, optional bearer authentication, JSON size limits, invalid JSON handling, and basic in-memory rate limiting. In production, it fails startup unless `PRISM_PROXY_SECRET` or `PRISM_BROWSER_PROXY_TOKEN` is set.

Use `PRISM_PROXY_SECRET` only for server-to-server requests or reverse proxies that inject `Authorization`. If the browser calls the proxy directly, use `PRISM_BROWSER_PROXY_TOKEN` with matching `VITE_PRISM_PROXY_AUTH_TOKEN`, and understand that this token is visible to browser users.

In-memory rate limiting is not sufficient for multiple instances or hostile public traffic. Put a real gateway, WAF, or reverse proxy in front of public deployments.

## Telegram Bridge

The bridge requires `WS_SECRET` and `ALLOWED_CHAT_IDS` in production. It accepts `Authorization: Bearer <secret>` for WebSocket auth and keeps `?token=` compatibility for local development.

Fallback command plans are simulated and do not perform real external actions.
