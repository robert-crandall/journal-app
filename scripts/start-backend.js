#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

// Get the port from environment variable, default to 3001
const BACKEND_PORT = process.env.PORT || '3001';
const PID_FILE = path.join(os.tmpdir(), 'journal-app-backend.pid');
const LOG_FILE = path.join(os.tmpdir(), 'journal-app-backend.log');

// Check if backend is already running
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

  // First try to kill by saved PID if available
  try {
    if (fs.existsSync(PID_FILE)) {
      const pid = fs.readFileSync(PID_FILE, 'utf-8').trim();
      if (pid) {
        try {
          process.kill(parseInt(pid, 10), 0); // Check if process exists
          spawnSync('kill', ['-9', pid]);
          console.log(`✅ Killed backend process with PID: ${pid}`);
        } catch (e) {
          // Process doesn't exist, ignore
        }
      }
      fs.unlinkSync(PID_FILE);
    }
  } catch (e) {
    console.warn(`⚠️  Could not kill process from PID file:`, e.message);
  }

  // Fallback to searching for processes
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

// Save PID to temp file
function savePid(pid) {
  try {
    fs.writeFileSync(PID_FILE, pid.toString());
  } catch (e) {
    console.warn(`⚠️  Could not save PID file:`, e.message);
  }
}

// Read logs if backend is already running
function displayBackendStatus() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      // Get last few lines of the log file
      const { spawnSync } = require('child_process');
      const tail = spawnSync('tail', ['-n', '5', LOG_FILE], { encoding: 'utf-8' });
      console.log(`\nRecent backend logs:`);
      console.log(tail.stdout);
    }
  } catch (e) {
    // Ignore error reading logs
  }
}

async function startBackend() {
  console.log('🔍 Checking if backend is running...');

  // Check for --force flag
  if (process.argv.includes('--force')) {
    console.log('🛑 --force flag detected: Killing backend processes');
    killBackendProcesses();
  }

  const backendRunning = await isBackendRunning();

  if (backendRunning) {
    console.log(`✅ Backend is already running on http://localhost:${BACKEND_PORT}`);
    displayBackendStatus();

    // Keep this terminal attached to the backend
    if (process.argv.includes('--attach')) {
      console.log('🔄 Attaching to running backend process. Press Ctrl+C to detach.');
      // Keep the script running until ctrl+c
      process.stdin.resume();
      return;
    }

    return;
  }

  if (await isPortInUse(BACKEND_PORT)) {
    console.log(`❌ Port ${BACKEND_PORT} is in use but backend is not responding.`);
    console.log(`Run 'bun run start-backend --force' to kill the process and restart.`);
    return;
  }

  console.log('🚀 Starting backend...');

  // Open log file for writing
  const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
  logStream.write(`\n\n--- Backend started at ${new Date().toISOString()} ---\n\n`);

  const backend = spawn('bun', ['run', 'dev'], {
    cwd: './backend',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env, PORT: BACKEND_PORT },
    detached: !process.argv.includes('--attach'),
  });

  // Save PID for future reference
  savePid(backend.pid);

  // Pipe output to both console and log file
  backend.stdout.pipe(process.stdout);
  backend.stderr.pipe(process.stderr);
  backend.stdout.pipe(logStream);
  backend.stderr.pipe(logStream);

  // Wait for backend to start
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    attempts++;

    if (await isBackendRunning()) {
      console.log(`✅ Backend started successfully on http://localhost:${BACKEND_PORT}`);

      if (!process.argv.includes('--attach')) {
        console.log('ℹ️  Backend is running in the background. To view logs run:');
        console.log(`   cat ${LOG_FILE}`);
        console.log('To attach to this process, run:');
        console.log('   bun run start-backend --attach');

        // Detach process if not in --attach mode
        backend.unref();
        return;
      } else {
        // Keep the process running in the foreground
        console.log('🔄 Running in attached mode. Press Ctrl+C to stop the backend.');
        return;
      }
    }

    console.log(`⏳ Waiting for backend to start... (${attempts}/${maxAttempts})`);
  }

  console.log('❌ Backend failed to start after multiple attempts');
  backend.kill();
}

startBackend().catch((error) => {
  console.error('❌ Error starting backend:', error.message);
  process.exit(1);
});
