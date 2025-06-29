#!/usr/bin/env node

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function showLogs() {
  console.log('📋 Checking running services...\n')

  try {
    // Check for backend processes
    try {
      const { stdout: backendProcs } = await execAsync(`ps aux | grep -E "(bun.*dev|node.*backend)" | grep -v grep`)
      if (backendProcs.trim()) {
        console.log('🔧 Backend processes:')
        console.log(backendProcs)
      }
    } catch {
      console.log('🔧 No backend processes found')
    }

    // Check for frontend processes  
    try {
      const { stdout: frontendProcs } = await execAsync(`ps aux | grep -E "(vite|svelte)" | grep -v grep`)
      if (frontendProcs.trim()) {
        console.log('🎨 Frontend processes:')
        console.log(frontendProcs)
      }
    } catch {
      console.log('🎨 No frontend processes found')
    }

    // Show port usage
    console.log('\n🌐 Port usage:')
    try {
      const { stdout: ports } = await execAsync(`lsof -i :3000,:5173,:4173 | grep LISTEN`)
      if (ports.trim()) {
        console.log(ports)
      } else {
        console.log('No services listening on common ports (3000, 5173, 4173)')
      }
    } catch {
      console.log('Could not check port usage')
    }

    // Show service status
    console.log('\n🔍 Service health check:')
    
    // Check backend
    try {
      const response = await fetch('http://localhost:3000')
      if (response.ok) {
        console.log('✅ Backend: Running on http://localhost:3000')
      }
    } catch {
      console.log('❌ Backend: Not responding on http://localhost:3000')
    }

    // Check frontend (try common ports)
    const frontendPorts = [5173, 4173]
    let frontendFound = false
    
    for (const port of frontendPorts) {
      try {
        const response = await fetch(`http://localhost:${port}`)
        if (response.ok) {
          console.log(`✅ Frontend: Running on http://localhost:${port}`)
          frontendFound = true
          break
        }
      } catch {
        // Port not responding
      }
    }
    
    if (!frontendFound) {
      console.log('❌ Frontend: Not responding on common ports (5173, 4173)')
    }

    console.log('\n💡 Commands:')
    console.log('  bun run backend  - Start/check backend')
    console.log('  bun run frontend - Start/check frontend') 
    console.log('  bun dev          - Start both with combined logs')
    console.log('  bun run logs     - Show this status')

  } catch (error) {
    console.error('❌ Error checking services:', error.message)
    process.exit(1)
  }
}

// Add fetch polyfill for Node.js if needed
if (typeof fetch === 'undefined') {
  try {
    const { default: fetch } = await import('node-fetch')
    global.fetch = fetch
  } catch {
    console.log('ℹ️  Install node-fetch for better service checking: bun add node-fetch')
  }
}

showLogs()
