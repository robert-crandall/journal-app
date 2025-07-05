# Build stage
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-alpine

RUN apk add --no-cache \
    postgresql-client \
    bash \
    curl

WORKDIR /app

# Set build timestamp
ARG BUILD_TIME
ENV BUILD_TIME=${BUILD_TIME}

# Copy built application and dependencies
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

COPY drizzle.config.ts ./
COPY drizzle ./drizzle
COPY docker-entrypoint.sh ./

RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

CMD ["/app/docker-entrypoint.sh"]
