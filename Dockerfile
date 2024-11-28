# Stage 1: Base build stage for all packages
FROM node:18-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace configuration and root dependencies
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all package.json files
COPY packages/app/package.json ./packages/app/
COPY packages/types/package.json ./packages/types/
COPY packages/workers/package.json ./packages/workers/

# Install all dependencies
RUN pnpm install

# Copy source code
COPY packages/app ./packages/app
COPY .env ./packages/app/
COPY packages/types ./packages/types
COPY packages/workers ./packages/workers

# Build all packages
RUN pnpm --filter types... build && \
    pnpm --filter app... build && \
    pnpm --filter workers... build

# Stage 2: Production image for app
FROM node:18-alpine AS app

RUN npm install -g pnpm && \
    apk add --no-cache netcat-openbsd

WORKDIR /app

# Copy workspace config and root dependencies
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy built packages from builder
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/app/package.json ./packages/app/
COPY --from=builder /app/packages/app/drizzle ./packages/app/drizzle
COPY --from=builder /app/packages/app/drizzle.config.ts ./packages/app/
COPY --from=builder /app/packages/app/build ./packages/app/build

# Install dependencies including drizzle-kit for migrations
RUN pnpm install --filter app... --filter types && \
    pnpm add -w drizzle-kit

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]

# Stage 3: Production image for workers
FROM node:18-alpine AS worker

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace config and root dependencies
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy built packages from builder
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/workers/package.json ./packages/workers/
COPY --from=builder /app/packages/workers/dist ./packages/workers/dist

# Install production dependencies only
RUN pnpm install --prod --filter workers... --filter types

CMD ["pnpm", "--filter", "workers", "run", "start"]
