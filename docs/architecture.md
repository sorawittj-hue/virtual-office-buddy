# Architecture

```text
Browser
  |
  |-- Frontend :3000
  |
  |-- Proxy :3001 -- OpenRouter/OpenAI
  |              `-- Hermes Agent :9119
  |
  `-- WS Bridge :18789 -- Telegram Bot -- LLM Provider
```

## Components

- Frontend: React/TanStack/Vite app.
- Proxy: local HTTP server for chat streaming and Hermes API forwarding.
- Hermes Agent: optional local agent service.
- WS Bridge: optional Telegram-to-dashboard bridge.
- LLM Provider: OpenRouter/OpenAI for chat and optional Anthropic fallback in the Telegram bridge.
