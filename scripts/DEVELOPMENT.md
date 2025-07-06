# Development Scripts

This project includes convenient scripts to manage the backend and frontend services.

## Quick Start

```bash
# Start both backend and frontend with combined logs
bun dev

# Or start them individually
bun run backend    # Start/check backend only
bun run frontend   # Start/check frontend only

# Check status of running services
bun run logs
```

## Available Commands

### `bun dev`

- Starts both backend and frontend simultaneously
- Shows combined logs with color-coded prefixes
- Automatically stops all services when you press Ctrl+C
- Uses `concurrently` to manage multiple processes

### `bun run backend`

- Checks if backend is already running on port 3000
- If running: exits with success (code 0)
- If not running: starts the backend
- If port is occupied but backend not responding: exits with error (code 1)

### `bun run frontend`

- Checks if frontend is already running on common ports (5173, 4173, etc.)
- If running: exits with success (code 0)
- If not running: starts the frontend
- If port is occupied but frontend not responding: exits with error (code 1)

### `bun run logs`

- Shows status of all running services
- Displays process information
- Shows port usage
- Performs health checks on backend and frontend
- Lists available commands

## Service URLs

- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:5173 (or 4173 for preview)

## Troubleshooting

### Services won't start

```bash
# Check what's running
bun run logs

# Kill processes on specific ports if needed
lsof -ti :3000 | xargs kill -9  # Kill backend
lsof -ti :5173 | xargs kill -9  # Kill frontend
```

### Combined logs not working

Make sure `concurrently` is installed:

```bash
bun add -D concurrently
```

### Health checks failing

Install `node-fetch` for better service detection:

```bash
bun add node-fetch
```

## Examples

```bash
# Start everything and see combined logs
bun dev

# In another terminal, check status
bun run logs

# Start only backend (useful for frontend development)
bun run backend

# Start only frontend (if backend is already running)
bun run frontend
```

The scripts are smart enough to detect if services are already running and won't start duplicates.
