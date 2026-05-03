# Deployment

Virtual Office Buddy is safest as a local or private-network tool. Public deployments require a reverse proxy, TLS, authentication, and careful secret handling.

## Frontend

Build the app:

```bash
npm run build
```

Deploy the generated build output according to your hosting provider. Do not put private API keys in `VITE_` variables because Vite exposes those to the browser bundle.

## Docker

The included Dockerfile is for private local preview and follows the npm lockfile:

```bash
docker compose up --build
```

It runs `vite preview` against the built output. For public production, put authentication/TLS in front of it or deploy with your hosting provider's production adapter.

## Proxy

For production-like proxy runs:

```bash
NODE_ENV=production PRISM_PROXY_SECRET=change-me npm run proxy
```

Set `PRISM_ALLOWED_ORIGINS` to the exact frontend origins. Do not use `*` unless you intentionally accept any browser origin and have another authentication layer.

`PRISM_PROXY_SECRET` is intended for server-to-server calls or a reverse proxy that injects the `Authorization` header. Browser JavaScript cannot keep that value private.

For private-network browser-direct deployments, use a separate browser-facing token:

```dotenv
PRISM_BROWSER_PROXY_TOKEN=private-browser-token-at-least-24-chars
VITE_PRISM_PROXY_AUTH_TOKEN=private-browser-token-at-least-24-chars
```

That token is visible to browser users. Do not treat it as a public internet security boundary; put real authentication in front of public deployments.

## Telegram Bridge

For production-like bridge runs:

```bash
NODE_ENV=production WS_SECRET=change-me ALLOWED_CHAT_IDS=123456789 npm run telegram
```

Use `Authorization: Bearer <WS_SECRET>` for WebSocket clients when possible. Query-string tokens remain for local compatibility but are easier to leak through logs and browser history.
