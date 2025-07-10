#!/usr/bin/env node

import { spawn, spawnSync } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import os from 'os';

const sleep = promisify(setTimeout);

// Configuration
const BACKEND_PORT = process.env.BACKEND_PORT || '3001';
const FRONTEND_PORT = process.env.FRONTEND_PORT || '5173';
const PID_FILE = path.join(os.tmpdir(), 'journal-app-dev.pid');

// Parse command line arguments
const args = process.argv.slice(2);
const isForce = args.includes('--force');
const isBackendOnly = args.includes('--backend-only');
const isFrontendOnly = args.includes('--frontend-only');

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix =
    {
      info: '🔍',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      start: '🚀',
    }[type] || 'ℹ️';

  console.log(`[${timestamp}] ${prefix} ${message}`);
}

// Check if a service is running and responding
async function isServiceRunning(port, checkContent = null) {
  try {
    const response = await fetch(`http://localhost:${port}`, {
      timeout: 2000,
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (!response.ok) return false;

    if (checkContent) {
      const text = await response.text();
      return checkContent.some((content) => text.includes(content));
    }

    return true;
  } catch {
    return false;
  }
}

// Check if backend is running
async function isBackendRunning() {
  try {
    const response = await fetch(`http://localhost:${BACKEND_PORT}/api/health`, {
      timeout: 2000,
      headers: { 'Cache-Control': 'no-cache' },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Check if frontend is running
async function isFrontendRunning() {
  return await isServiceRunning(FRONTEND_PORT, ['svelte', 'SvelteKit', 'Life Quest']);
}

// Get PIDs using a port (excluding port 3000 for Copilot)
function getPidsOnPort(port) {
  if (port === '3000') {
    log('Skipping port 3000 (reserved for Copilot)', 'warning');
    return [];
  }

  try {
    const result = spawnSync('lsof', ['-ti', `tcp:${port}`], { encoding: 'utf-8' });
    return result.stdout.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

// Kill processes on specific ports
function killProcessesOnPorts(ports) {
  ports.forEach((port) => {
    if (port === '3000') {
      log('Skipping port 3000 (reserved for Copilot)', 'warning');
      return;
    }

    const pids = getPidsOnPort(port);
    if (pids.length > 0) {
      try {
        spawnSync('kill', ['-9', ...pids]);
        log(`Killed process(es) on port ${port}: ${pids.join(', ')}`, 'success');
      } catch (e) {
        log(`Could not kill process on port ${port}: ${e.message}`, 'error');
      }
    }
  });
}

// Kill development processes by pattern
function killDevProcesses() {
  try {
    // Find and kill backend processes
    const backendResult = spawnSync('pgrep', ['-f', 'bun.*run.*--hot.*src/index.ts'], { encoding: 'utf-8' });
    const backendPids = backendResult.stdout.split('\n').filter(Boolean);
    if (backendPids.length > 0) {
      spawnSync('kill', ['-9', ...backendPids]);
      log(`Killed backend process(es): ${backendPids.join(', ')}`, 'success');
    }

    // Find and kill frontend processes (vite dev)
    const frontendResult = spawnSync('pgrep', ['-f', 'vite dev'], { encoding: 'utf-8' });
    const frontendPids = frontendResult.stdout.split('\n').filter(Boolean);
    if (frontendPids.length > 0) {
      spawnSync('kill', ['-9', ...frontendPids]);
      log(`Killed frontend process(es): ${frontendPids.join(', ')}`, 'success');
    }

    // Clean up PID file
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
    }
  } catch (e) {
    log(`Error killing dev processes: ${e.message}`, 'warning');
  }
}

// Run database migrations
async function runMigrations() {
  log('Applying database migrations...');
  try {
    const result = spawnSync('bun', ['run', 'db:migrate'], {
      cwd: './backend',
      stdio: 'inherit',
    });

    if (result.status === 0) {
      log('Database migrations applied successfully', 'success');
      return true;
    } else {
      log('Database migration failed', 'error');
      return false;
    }
  } catch (error) {
    log(`Database migration error: ${error.message}`, 'error');
    return false;
  }
}

// Start backend service
async function startBackend() {
  if (!isBackendOnly && !isFrontendOnly) {
    log('Starting backend service...');
  }

  const backend = spawn('bun', ['run', 'dev'], {
    cwd: './backend',
    stdio: 'inherit',
    env: { ...process.env, PORT: BACKEND_PORT },
  });

  // Wait for backend to be ready
  let attempts = 0;
  const maxAttempts = 15;

  while (attempts < maxAttempts) {
    await sleep(1000);
    attempts++;

    if (await isBackendRunning()) {
      log(`Backend started successfully on http://localhost:${BACKEND_PORT}`, 'success');
      return backend;
    }

    if (!isBackendOnly && !isFrontendOnly) {
      log(`Waiting for backend... (${attempts}/${maxAttempts})`);
    }
  }

  log('Backend failed to start after multiple attempts', 'error');
  backend.kill();
  throw new Error('Backend startup failed');
}

// Start frontend service
async function startFrontend() {
  if (!isBackendOnly && !isFrontendOnly) {
    log('Starting frontend service...');
  }

  const frontend = spawn('bun', ['run', 'dev'], {
    cwd: './frontend',
    stdio: 'inherit',
  });

  // Wait for frontend to be ready
  let attempts = 0;
  const maxAttempts = 15;

  while (attempts < maxAttempts) {
    await sleep(1000);
    attempts++;

    if (await isFrontendRunning()) {
      log(`Frontend started successfully on http://localhost:${FRONTEND_PORT}`, 'success');
      return frontend;
    }

    if (!isBackendOnly && !isFrontendOnly) {
      log(`Waiting for frontend... (${attempts}/${maxAttempts})`);
    }
  }

  log('Frontend failed to start after multiple attempts', 'error');
  frontend.kill();
  throw new Error('Frontend startup failed');
}

// Save PIDs for cleanup
function savePids(processes) {
  try {
    const pids = processes.map((p) => p.pid).filter(Boolean);
    fs.writeFileSync(PID_FILE, pids.join('\n'));
  } catch (e) {
    log(`Could not save PID file: ${e.message}`, 'warning');
  }
}

// Main development function
async function startDevelopment() {
  try {
    log('Starting Journal App Development Environment', 'start');

    // Handle force flag
    if (isForce) {
      log('Force flag detected - killing existing processes', 'warning');

      if (!isFrontendOnly) {
        // Kill backend processes and port
        const backendResult = spawnSync('pgrep', ['-f', 'bun.*run.*--hot.*src/index.ts'], { encoding: 'utf-8' });
        const backendPids = backendResult.stdout.split('\n').filter(Boolean);
        if (backendPids.length > 0) {
          spawnSync('kill', ['-9', ...backendPids]);
          log(`Killed backend process(es): ${backendPids.join(', ')}`, 'success');
        }
        killProcessesOnPorts([BACKEND_PORT]);
      }

      if (!isBackendOnly) {
        // Kill frontend processes and port
        const frontendResult = spawnSync('pgrep', ['-f', 'vite dev'], { encoding: 'utf-8' });
        const frontendPids = frontendResult.stdout.split('\n').filter(Boolean);
        if (frontendPids.length > 0) {
          spawnSync('kill', ['-9', ...frontendPids]);
          log(`Killed frontend process(es): ${frontendPids.join(', ')}`, 'success');
        }
        killProcessesOnPorts([FRONTEND_PORT]);
      }

      // Clean up PID file
      if (fs.existsSync(PID_FILE)) {
        fs.unlinkSync(PID_FILE);
      }
    }

    // Check what's already running
    const backendRunning = await isBackendRunning();
    const frontendRunning = await isFrontendRunning();

    if (!isForce) {
      // Check if services are already running
      if (!isFrontendOnly && backendRunning) {
        log(`Backend already running on http://localhost:${BACKEND_PORT}`, 'success');
        if (isBackendOnly) {
          log('Backend-only mode: Nothing to do');
          return;
        }
      }

      if (!isBackendOnly && frontendRunning) {
        log(`Frontend already running on http://localhost:${FRONTEND_PORT}`, 'success');
        if (isFrontendOnly) {
          log('Frontend-only mode: Nothing to do');
          return;
        }
      }

      if (backendRunning && frontendRunning && !isBackendOnly && !isFrontendOnly) {
        log('Both services already running. Use --force to restart.', 'success');
        return;
      }
    }

    // Check for port conflicts
    if (!isForce) {
      if (!isFrontendOnly && !backendRunning && getPidsOnPort(BACKEND_PORT).length > 0) {
        log(`Port ${BACKEND_PORT} is in use but backend is not responding. Use --force to kill and restart.`, 'error');
        process.exit(1);
      }

      if (!isBackendOnly && !frontendRunning && getPidsOnPort(FRONTEND_PORT).length > 0) {
        log(`Port ${FRONTEND_PORT} is in use but frontend is not responding. Use --force to kill and restart.`, 'error');
        process.exit(1);
      }
    }

    // Run migrations if starting backend
    if (!isFrontendOnly && (!backendRunning || isForce)) {
      const migrationsSuccess = await runMigrations();
      if (!migrationsSuccess) {
        log('Cannot continue without successful database migrations', 'error');
        process.exit(1);
      }
    }

    const processes = [];

    // Start services
    if (!isFrontendOnly && (!backendRunning || isForce)) {
      const backend = await startBackend();
      processes.push(backend);
    }

    if (!isBackendOnly && (!frontendRunning || isForce)) {
      const frontend = await startFrontend();
      processes.push(frontend);
    }

    if (processes.length > 0) {
      // Save PIDs for cleanup
      savePids(processes);

      // Display status
      console.log('\n' + '='.repeat(60));
      log('Development environment ready!', 'success');

      if (!isFrontendOnly) {
        log(`Backend: http://localhost:${BACKEND_PORT}`);
      }
      if (!isBackendOnly) {
        log(`Frontend: http://localhost:${FRONTEND_PORT}`);
      }

      console.log('='.repeat(60));
      log('Press Ctrl+C to stop all services');

      // Handle graceful shutdown
      const shutdown = () => {
        log('Shutting down development environment...', 'warning');
        processes.forEach((process) => {
          try {
            process.kill('SIGTERM');
          } catch (e) {
            // Process might already be dead
          }
        });

        // Clean up PID file
        if (fs.existsSync(PID_FILE)) {
          fs.unlinkSync(PID_FILE);
        }

        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      // Wait for processes to exit
      await Promise.all(processes.map((process) => new Promise((resolve) => process.on('exit', resolve))));
    }
  } catch (error) {
    log(`Development startup failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Show help
function showHelp() {
  console.log(`
Journal App Development Server

Usage: bun run dev [options]

Options:
  --force          Kill existing processes and restart
  --backend-only   Start only the backend service
  --frontend-only  Start only the frontend service
  --help           Show this help message

Examples:
  bun run dev                    # Start both services
  bun run dev --force            # Kill existing and restart both
  bun run dev --backend-only     # Start only backend
  bun run dev --frontend-only    # Start only frontend

Ports:
  Backend:  http://localhost:${BACKEND_PORT}
  Frontend: http://localhost:${FRONTEND_PORT}

Note: Port 3000 is reserved for GitHub Copilot and will not be touched.
`);
}

// Main entry point
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
} else {
  startDevelopment();
}
