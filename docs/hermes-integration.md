# Hermes Integration

Virtual Office Buddy can connect to a local Hermes Agent through `proxy-server.js`.

Default local endpoint:

```dotenv
VITE_HERMES_LOCAL_URL=http://localhost:9119
```

The proxy fetches the Hermes session token from the local Hermes dashboard page and forwards selected API calls:

- `/api/hermes/status`
- `/api/hermes/pty-token`
- `/api/hermes/sessions`
- `/api/hermes/config`
- `/api/hermes/memory`
- `/api/hermes/crons`
- `/api/hermes/gateway/restart`

If Hermes is unavailable, the app should remain usable in standalone/demo mode where possible.
