# Deployment

Virtual Office Buddy is safest as a local or private-network tool. Public deployments require a reverse proxy, TLS, authentication, and careful secret handling.

## Frontend

Build the app:

```bash
npm run build
```

Deploy the generated build output according to your hosting provider. Do not put private API keys in `VITE_` variables because Vite exposes those to the browser bundle.

## Proxy

For production-like proxy runs:

```bash
NODE_ENV=production PRISM_PROXY_SECRET=change-me npm run proxy
```

Set `PRISM_ALLOWED_ORIGINS` to the exact frontend origins. Do not use `*` unless you intentionally accept any browser origin and have another authentication layer.

## Telegram Bridge

For production-like bridge runs:

```bash
NODE_ENV=production WS_SECRET=change-me ALLOWED_CHAT_IDS=123456789 npm run telegram
```

Use `Authorization: Bearer <WS_SECRET>` for WebSocket clients when possible. Query-string tokens remain for local compatibility but are easier to leak through logs and browser history.
