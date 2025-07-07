#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';

const execAsync = promisify(exec);

// Get the port from environment variable, default to 3001
const BACKEND_PORT = process.env.PORT || '3001';

// Check if backend is already running
async function isBackendRunning() {
  try {
    const response = await fetch(`http://localhost:${BACKEND_PORT}/api/health`, { timeout: 2000 });
    return response.ok;
  } catch {
    return false;
  }
}

// Kill processes using specified ports (macOS/Linux)
function killProcessesOnPorts(ports) {
  const { spawnSync } = require('child_process');
  ports.forEach((port) => {
    try {
      // lsof -ti tcp:<port> | xargs kill -9
      const lsof = spawnSync('lsof', ['-ti', `tcp:${port}`], { encoding: 'utf-8' });
      const pids = lsof.stdout.split('\n').filter(Boolean);
      if (pids.length > 0) {
        spawnSync('kill', ['-9', ...pids]);
        console.log(`✅ Killed process(es) on port ${port}: ${pids.join(', ')}`);
      }
    } catch (e) {
      console.warn(`⚠️  Could not kill process on port ${port}:`, e.message);
    }
  });
}

function killBackendProcesses() {
  const { spawnSync } = require('child_process');
  try {
    // Find processes running the backend specifically
    // Look for "bun run --hot src/index.ts" or "bun run dev" in backend directory
    const pgrep = spawnSync('pgrep', ['-f', 'bun.*run.*dev|bun.*run.*--hot.*src/index.ts'], { encoding: 'utf-8' });
    const pids = pgrep.stdout.split('\n').filter(Boolean);
    if (pids.length > 0) {
      spawnSync('kill', ['-9', ...pids]);
      console.log(`✅ Killed backend process(es): ${pids.join(', ')}`);
    }
  } catch (e) {
    console.warn(`⚠️  Could not kill backend processes:`, e.message);
  }
}

// Check if port is in use
async function isPortInUse(port) {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

async function startBackend() {
  console.log('🔍 Checking if backend is running...');

  // Check for --force flag
  if (process.argv.includes('--force')) {
    console.log('🛑 --force flag detected: Killing backend processes');
    killBackendProcesses();
  }

  if (await isBackendRunning()) {
    console.log(`✅ Backend is already running on http://localhost:${BACKEND_PORT}`);
    process.exit(0);
  }

  if (await isPortInUse(BACKEND_PORT)) {
    console.log(`❌ Port ${BACKEND_PORT} is in use but backend is not responding`);
    process.exit(1);
  }

  console.log('🚀 Starting backend...');

  const backend = spawn('bun', ['run', 'dev'], {
    cwd: './backend',
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: BACKEND_PORT },
  });

  // Wait a moment for startup
  await new Promise((resolve) => setTimeout(resolve, 3000));

  if (await isBackendRunning()) {
    console.log(`✅ Backend started successfully on http://localhost:${BACKEND_PORT}`);
    process.exit(0);
  } else {
    console.log('❌ Backend failed to start');
    backend.kill();
    process.exit(1);
  }
}

startBackend().catch((error) => {
  console.error('❌ Error starting backend:', error.message);
  process.exit(1);
});
