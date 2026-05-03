# Virtual Office Buddy

Virtual Office Buddy is a local-first web dashboard for a Hermes-style AI office assistant. It can run in standalone demo mode through a local LLM proxy, or connect to a local Hermes Agent for sessions, memory, config, PTY, and gateway status.

## Feature Status

| Status                    | Features                                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Working                   | React/TanStack web app, 3D office scene, local chat UI, SSE chat through `proxy-server.js`, settings pages, model/provider configuration UI, local guardrail prompts and warnings     |
| Partial / requires Hermes | Sessions, memory, schedules, Hermes config/status, PTY connection, gateway controls, Telegram status from Hermes                                                                      |
| Demo / simulated          | Fallback Telegram command plans, many platform/tool cards, some workflow/task animations, client-side guardrail enforcement                                                           |
| Planned                   | Production authentication around deployed services, persistent audit logs, real integrations for every listed platform/tool, durable rate limiting, server-side guardrail enforcement |

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

In another terminal, start the local proxy if you want standalone chat:

```bash
npm run proxy
```

Open the app at `http://localhost:3000` or the Vite URL printed by the dev server.

## Security Notes

Do not expose `proxy-server.js` or `telegram-bridge.js` to the public internet without authentication and a trusted reverse proxy. Client-side guardrails are helpful UX checks, but they are not a security boundary. Protect API keys, Telegram bot tokens, WebSocket secrets, and Hermes endpoints.

For production-like runs:

- Set `NODE_ENV=production`.
- Set `PRISM_PROXY_SECRET` for the proxy.
- Set `WS_SECRET` and `ALLOWED_CHAT_IDS` for the Telegram bridge.
- Use a narrow `PRISM_ALLOWED_ORIGINS` list.

See [docs/security.md](docs/security.md) and [SECURITY.md](SECURITY.md) for the baseline.

## Docs

- [Getting started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [Deployment](docs/deployment.md)
- [Security](docs/security.md)
- [Hermes integration](docs/hermes-integration.md)
- [Telegram bridge](docs/telegram-bridge.md)
- [Troubleshooting](docs/troubleshooting.md)

## Useful Commands

```bash
npm run dev
npm run proxy
npm run telegram
npm run typecheck
npm run lint
npm run build
npm test
```

## Project Boundaries

Virtual Office Buddy is currently best treated as a local development and demo dashboard. The local proxy and Telegram bridge now include a safer default baseline, but production deployments still need network-level controls, secret management, TLS, monitoring, and server-side authorization around any public endpoint.
