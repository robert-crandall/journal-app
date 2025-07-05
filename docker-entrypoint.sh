#!/bin/bash
set -e

echo "Starting Example Application..."

# Parse DATABASE_URL to extract connection details
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  exit 1
fi

# Extract host and port from DATABASE_URL (format: postgresql://user:pass@host:port/db)
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

# Default to standard PostgreSQL port if not specified
if [ -z "$DB_PORT" ]; then
  DB_PORT=5432
fi

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT"; do
  echo "PostgreSQL is not ready yet. Waiting..."
  sleep 2
done

echo "Running database migrations..."
bun run db:migrate

echo "Starting server..."
exec bun run build/index.js
