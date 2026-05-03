# Telegram Bridge

`telegram-bridge.js` connects Telegram polling to the dashboard over WebSocket.

## Local Setup

```dotenv
TELEGRAM_BOT_TOKEN=
ALLOWED_CHAT_IDS=123456789
WS_PORT=18789
WS_SECRET=local-random-secret
RATE_LIMIT_PER_MIN=5
MAX_COMMAND_CHARS=4000
```

Run:

```bash
npm run telegram
```

## Authentication

Production requires `WS_SECRET` and `ALLOWED_CHAT_IDS`. Prefer WebSocket authentication with:

```http
Authorization: Bearer <WS_SECRET>
```

`?token=<WS_SECRET>` is still accepted for local compatibility, but query-string secrets can leak through logs and browser history.

## Simulated Actions

When no LLM provider is configured, fallback plans are simulated. They animate steps and return a clearly labeled simulated result; they do not send real email, schedule real meetings, write files, or call external services.
