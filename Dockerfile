# Local preview image. This follows the npm/package-lock workflow used by README and CI.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Use this image for private local preview. For public production, deploy behind
# platform authentication/TLS or use the hosting provider's production adapter.
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "3000"]
