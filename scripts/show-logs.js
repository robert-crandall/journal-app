#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

// Configuration matching dev.js
const BACKEND_PORT = process.env.BACKEND_PORT || '3001';
const FRONTEND_PORT = process.env.FRONTEND_PORT || '5173';
const PID_FILE = path.join(os.tmpdir(), 'journal-app-dev.pid');

async function showStatus() {
  console.log('📋 Journal App Development Status\n');

  // Check for running processes from PID file
  let savedPids = [];
  if (fs.existsSync(PID_FILE)) {
    try {
      const pidContent = fs.readFileSync(PID_FILE, 'utf-8');
      savedPids = pidContent.split('\n').filter(Boolean);
      console.log(`💾 Saved PIDs: ${savedPids.join(', ')}`);
    } catch (e) {
      console.log('⚠️  Could not read PID file');
    }
  }

  // Check for backend processes
  try {
    const { stdout: backendProcs } = await execAsync(`ps aux | grep -E "(bun.*run.*--hot.*src/index.ts)" | grep -v grep`);
    if (backendProcs.trim()) {
      console.log('🔧 Backend processes:');
      console.log(backendProcs);
    } else {
      console.log('🔧 No backend processes found');
    }
  } catch {
    console.log('🔧 No backend processes found');
  }

  // Check for frontend processes
  try {
    const { stdout: frontendProcs } = await execAsync(`ps aux | grep -E "(vite dev)" | grep -v grep`);
    if (frontendProcs.trim()) {
      console.log('\n🎨 Frontend processes:');
      console.log(frontendProcs);
    } else {
      console.log('\n🎨 No frontend processes found');
    }
  } catch {
    console.log('\n🎨 No frontend processes found');
  }

  // Show port usage
  console.log('\n🌐 Port usage:');
  try {
    const { stdout: ports } = await execAsync(`lsof -i :${BACKEND_PORT},:${FRONTEND_PORT},:3000 | grep LISTEN`);
    if (ports.trim()) {
      console.log(ports);
    } else {
      console.log(`No services listening on ports ${BACKEND_PORT}, ${FRONTEND_PORT}, 3000`);
    }
  } catch {
    console.log('Could not check port usage');
  }

  // Show service health check
  console.log('\n🔍 Service health check:');

  // Check backend
  try {
    const response = await fetch(`http://localhost:${BACKEND_PORT}/api/health`, { timeout: 2000 });
    if (response.ok) {
      console.log(`✅ Backend: Running on http://localhost:${BACKEND_PORT}`);
    } else {
      console.log(`❌ Backend: Not healthy on http://localhost:${BACKEND_PORT}`);
    }
  } catch {
    console.log(`❌ Backend: Not responding on http://localhost:${BACKEND_PORT}`);
  }

  // Check frontend
  try {
    const response = await fetch(`http://localhost:${FRONTEND_PORT}`, { timeout: 2000 });
    if (response.ok) {
      const text = await response.text();
      if (text.includes('svelte') || text.includes('SvelteKit') || text.includes('Life Quest')) {
        console.log(`✅ Frontend: Running on http://localhost:${FRONTEND_PORT}`);
      } else {
        console.log(`⚠️  Frontend: Something else running on http://localhost:${FRONTEND_PORT}`);
      }
    } else {
      console.log(`❌ Frontend: Not responding on http://localhost:${FRONTEND_PORT}`);
    }
  } catch {
    console.log(`❌ Frontend: Not responding on http://localhost:${FRONTEND_PORT}`);
  }

  console.log('\n💡 Available commands:');
  console.log('  bun run dev              - Start both services');
  console.log('  bun run dev:force        - Kill existing and restart both');
  console.log('  bun run dev:backend      - Start only backend');
  console.log('  bun run dev:frontend     - Start only frontend');
  console.log('  bun run logs             - Show this status');
  console.log('  bun scripts/dev.js --help - Show detailed help');
}

showStatus().catch((error) => {
  console.error('❌ Error checking services:', error.message);
  process.exit(1);
});
