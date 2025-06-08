# Combined Frontend & Backend Dockerfile
# Multi-stage build for optimal container size

# Stage 1: Build frontend
FROM oven/bun:1-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json frontend/bun.lock* ./

# Install frontend dependencies
RUN bun install --frozen-lockfile

# Copy frontend source code
COPY frontend/ ./

# Build the frontend for production (static files)
RUN bun run build

# Stage 2: Setup backend and final image
FROM oven/bun:1-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    bash \
    curl

# Create app directory
WORKDIR /app

# Copy backend package files first for better caching
COPY backend/package.json backend/bun.lock* ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN bun install --frozen-lockfile --production

# Copy backend source code
COPY backend/ ./

# Copy the static frontend build to the backend directory
COPY --from=frontend-builder /app/frontend/build ./frontend
# Create a startup script
WORKDIR /app
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose only the backend port (which now serves the frontend too)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start the combined service
CMD ["/app/docker-entrypoint.sh"]
