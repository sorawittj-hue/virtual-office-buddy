# Getting Started

## Requirements

- Node.js 22
- npm
- Optional: a local Hermes Agent on `http://localhost:9119`
- Optional: OpenRouter or OpenAI API key for standalone chat

## Install

```bash
npm install
cp .env.example .env
```

Set at least one chat provider key for standalone mode:

```dotenv
OPENROUTER_API_KEY=
OPENAI_API_KEY=
```

## Run Locally

Start the frontend:

```bash
npm run dev
```

Start the local proxy:

```bash
npm run proxy
```

The default proxy allows only localhost origins. If your frontend uses a different local port, add it to `PRISM_ALLOWED_ORIGINS`.

## Modes

Standalone mode uses `proxy-server.js` and an LLM provider for chat. Hermes-backed pages show empty or simulated states when Hermes is not connected.

Hermes mode expects a local Hermes Agent at `VITE_HERMES_LOCAL_URL`, usually `http://localhost:9119`.
