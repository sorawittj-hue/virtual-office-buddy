# Security Policy

## Supported Usage Model

Virtual Office Buddy is intended for local development, demos, and private-network use. Public internet deployments require additional authentication, TLS, reverse-proxy hardening, monitoring, and secret management.

## Secrets Handling

Do not commit real secrets. Protect:

- `OPENROUTER_API_KEY`
- `OPENAI_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `PRISM_PROXY_SECRET`
- `WS_SECRET`
- Hermes API endpoints and tokens

## Public Exposure Warning

Do not expose `proxy-server.js` or `telegram-bridge.js` publicly without authentication. In production, the proxy requires `PRISM_PROXY_SECRET`, and the Telegram bridge requires `WS_SECRET` plus `ALLOWED_CHAT_IDS`.

## Reporting Vulnerabilities

Open a private security advisory or contact the repository maintainer with reproduction steps, expected impact, affected versions/commit, and any suggested mitigation. Do not post exploitable details in public issues before a fix is available.

## Known Limitations

- Client-side guardrails are bypassable and are not a security boundary.
- The local proxy depends on correct CORS/auth configuration.
- The Telegram bridge requires `ALLOWED_CHAT_IDS` and `WS_SECRET` in production.
- In-memory rate limits reset on restart and do not coordinate across instances.
