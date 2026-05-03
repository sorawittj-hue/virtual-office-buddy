# Troubleshooting

## Proxy rejects the browser

Add the frontend origin to `PRISM_ALLOWED_ORIGINS`.

```dotenv
PRISM_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Proxy fails in production

Set `PRISM_PROXY_SECRET` when `NODE_ENV=production`.

## Chat returns 503

Set `OPENROUTER_API_KEY` or `OPENAI_API_KEY`, then restart `npm run proxy`.

## Hermes pages are empty

Start Hermes locally and verify `VITE_HERMES_LOCAL_URL` points to it. The default is `http://localhost:9119`.

## Telegram bridge exits in production

Set `TELEGRAM_BOT_TOKEN`, `WS_SECRET`, and `ALLOWED_CHAT_IDS`. `WS_SECRET` must be at least 24 characters in production.
