# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Stage 3: Production runtime ───────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Copy full build output (wrangler needs node_modules for local Workers runtime)
COPY --from=builder /app /app

ENV NODE_ENV=production
EXPOSE 3000

# Run via Wrangler local Workers runtime (Miniflare)
CMD ["npx", "wrangler", "dev", "--port", "3000", "--host", "0.0.0.0", "--local"]
