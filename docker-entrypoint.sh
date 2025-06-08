#!/bin/bash
set -e

echo "Starting Journal Application..."

# Parse DATABASE_URL to extract connection details for pg_isready
if [ -n "$DATABASE_URL" ]; then
  # Extract host, port, and user from DATABASE_URL
  DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*://[^@]*@\([^:]*\):.*|\1|p')
  DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*://[^@]*@[^:]*:\([0-9]*\)/.*|\1|p')
  DB_USER=$(echo $DATABASE_URL | sed -n 's|.*://\([^:]*\):.*@.*|\1|p')
else
  # Fallback to individual environment variables
  DB_HOST="${DATABASE_HOST:-localhost}"
  DB_PORT="${DATABASE_PORT:-5432}"
  DB_USER="${DATABASE_USER:-postgres}"
fi

# Wait for PostgreSQL to be ready
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
done

# Run database migrations
echo "Running database migrations..."
cd /app/backend
bun run db:migrate

# Start the combined backend + frontend server
echo "Starting combined server (backend + static frontend)..."
cd /app/backend
exec bun run src/index.ts
