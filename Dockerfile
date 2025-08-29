# Combined Frontend & Backend Dockerfile
# Multi-stage build for optimal container size

# Stage 1: Install backend dependencies (reused across stages)
FROM oven/bun:1-alpine AS backend-deps

WORKDIR /app

# Copy workspace configuration and lock file
COPY package.json bun.lock* ./
COPY backend/package.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN bun install

# Stage 3: Build frontend with access to backend types
FROM oven/bun:1-alpine AS frontend-builder

WORKDIR /app

# Copy workspace configuration and lock file
COPY package.json bun.lock* ./

# Copy backend and shared types/models that frontend needs
COPY backend/ ./backend/
COPY shared/ ./shared/

# Setup frontend
COPY frontend/package.json ./frontend/
WORKDIR /app/frontend
RUN bun install

# Copy frontend source code
COPY frontend/ ./

# Build the frontend for production (static files)
RUN bun run build

# Stage 4: Setup backend and final image
FROM oven/bun:1-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    bash \
    curl

# Create app directory
WORKDIR /app

# Copy workspace configuration and lock file
COPY package.json bun.lock* ./

# Copy backend dependencies from the dedicated deps stage
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend/package.json ./backend/

# Copy backend source code
COPY backend/ ./backend/
# Copy shared types
COPY shared/ ./shared/

# Copy the frontend build output (static files)
COPY --from=frontend-builder /app/frontend/build ./frontend

# Create uploads directory with proper permissions
RUN mkdir -p ./uploads && chmod 755 ./uploads

# Create a startup script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOAD_DIR=/app/uploads
# DATABASE_URL should be set via docker-compose or runtime environment

# Expose only the backend port (which now serves the frontend too)
EXPOSE 3000

# Declare volume for uploaded files (for persistence)
VOLUME ["/app/uploads"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start the combined service
CMD ["/app/docker-entrypoint.sh"]
