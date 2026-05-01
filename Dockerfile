# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# ── Stage 3: Production runtime ───────────────────────────────────────────────
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Copy full build output (wrangler needs node_modules for local Workers runtime)
COPY --from=builder /app /app

ENV NODE_ENV=production
EXPOSE 3000

# Run via Wrangler local Workers runtime (Miniflare)
CMD ["bunx", "--bun", "wrangler", "dev", "--port", "3000", "--host", "0.0.0.0", "--local"]
