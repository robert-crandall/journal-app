#!/usr/bin/env node

import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import fetch from 'node-fetch'

const execAsync = promisify(exec)

// Check if frontend is already running (try common ports)
async function isFrontendRunning() {
  const ports = [5173, 4173, 3000, 5000]
  
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}`, { timeout: 2000 })
      if (response.ok) {
        const text = await response.text()
        // Check if it's a SvelteKit app
        if (text.includes('svelte') || text.includes('SvelteKit') || text.includes('Life Quest')) {
          console.log(`✅ Frontend found running on http://localhost:${port}`)
          return { running: true, port }
        }
      }
    } catch {
      // Port not responding
    }
  }
  
  return { running: false, port: null }
}

// Check if port is in use
async function isPortInUse(port) {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`)
    return stdout.trim().length > 0
  } catch {
    return false
  }
}

async function startFrontend() {
  console.log('🔍 Checking if frontend is running...')
  
  const { running, port } = await isFrontendRunning()
  if (running) {
    console.log(`✅ Frontend is already running on http://localhost:${port}`)
    process.exit(0)
  }

  if (await isPortInUse(5173)) {
    console.log('❌ Port 5173 is in use but frontend is not responding')
    process.exit(1)
  }

  console.log('🚀 Starting frontend...')
  
  const frontend = spawn('bun', ['run', 'dev'], {
    cwd: './frontend',
    stdio: 'inherit',
    shell: true
  })

  // Wait a moment for startup
  await new Promise(resolve => setTimeout(resolve, 5000))

  const { running: isRunning, port: runningPort } = await isFrontendRunning()
  if (isRunning) {
    console.log(`✅ Frontend started successfully on http://localhost:${runningPort}`)
    process.exit(0)
  } else {
    console.log('❌ Frontend failed to start')
    frontend.kill()
    process.exit(1)
  }
}

startFrontend().catch(error => {
  console.error('❌ Error starting frontend:', error.message)
  process.exit(1)
})
