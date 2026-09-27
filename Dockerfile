# Build stage
FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
RUN bun run build

# Production dependencies stage - devDependencies excluded from the runner image
FROM oven/bun:1-alpine AS prod-deps
WORKDIR /app
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile --ignore-scripts --production

# Production stage - needs Chrome for Lighthouse
FROM node:22.19-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install Chrome dependencies and Chrome
RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_PATH=/usr/bin/chromium

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Don't rely on the base image's /tmp permissions (they vary across bases
# and can be tightened by a host's runtime config); give the app its own
# writable temp dir instead.
RUN mkdir -p /app/.tmp && chown nodejs:nodejs /app/.tmp
ENV TMPDIR=/app/.tmp

COPY --from=builder --chown=nodejs:nodejs /app/bin ./bin
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
USER nodejs
ENTRYPOINT ["node", "bin/lighthouse-badges.js"]
