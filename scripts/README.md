# Development Server

This folder contains the unified development server for the Journal App.

## Quick Start

```bash
# Start both backend and frontend
bun run dev

# Check status of services
bun run logs

# Get help
bun scripts/dev.js --help
```

## Available Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start both backend and frontend services |
| `bun run dev:force` | Kill existing processes and restart both services |
| `bun run dev:backend` | Start only the backend service |
| `bun run dev:frontend` | Start only the frontend service |
| `bun run logs` | Show status of running services |

## Features

- **Smart Detection**: Checks if services are already running before starting new ones
- **Selective Force**: `--force` flag only affects the services you're starting
- **Port Protection**: Never kills processes on port 3000 (reserved for GitHub Copilot)
- **Health Checks**: Validates that services are actually responding, not just running
- **Process Management**: Tracks PIDs for proper cleanup
- **Database Migrations**: Automatically runs migrations when starting backend

## Service Ports

- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:5173

## Environment Variables

You can customize ports by setting environment variables:

```bash
export BACKEND_PORT=3001
export FRONTEND_PORT=5173
bun run dev
```

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors but the service isn't responding:

```bash
# Force restart the problematic service
bun run dev:force

# Or restart just one service
bun run dev:backend --force
bun run dev:frontend --force
```

### Service Not Starting

Check the status and recent logs:

```bash
bun run logs
```

### Clean Restart

To completely clean up and restart everything:

```bash
bun run dev:force
```

## Migration from Old Scripts

The old scripts have been replaced:

- ~~`scripts/start-backend.js`~~ → `bun run dev:backend`
- ~~`scripts/start-frontend.js`~~ → `bun run dev:frontend` 
- ~~`scripts/start-dev.js`~~ → `bun run dev`

The new unified script is more reliable and provides better error handling.
