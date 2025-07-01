---
description: Hono testing guide for junior developers, focusing on integration testing with real HTTP requests and minimal unit testing.
applyTo: "backend/**/*.{test,spec}.{js,ts,jsx,tsx,svelte}"
---

# Hono Testing Guide for Junior Developers

This guide covers testing strategies and best practices for Hono applications, focusing on integration testing with real HTTP requests.

## Overview

Testing Hono applications is straightforward and follows standard HTTP testing patterns. The key principle is to test your application as close to production as possible by making real HTTP requests to your endpoints.

## Testing Philosophy

- **Integration-First**: Write tests that make actual HTTP requests to your API endpoints
- **Real Database Operations**: Test with actual database connections and operations
- **End-to-End Coverage**: Test the complete request/response cycle including middleware
- **Type Safety**: Leverage Hono's type-safe testing utilities

## Setup

### Required Dependencies

```bash
# Install testing framework
bun add -D vitest

# For TypeScript support
bun add -D @types/node
```

### Test Configuration (Vitest)

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
})
```

## Core Testing Approaches

### 1. Using `app.request()` (Basic Approach)

The most straightforward way to test Hono applications:

```typescript
// app.ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/posts', (c) => {
  return c.json([
    { id: 1, title: 'First Post' },
    { id: 2, title: 'Second Post' }
  ])
})

app.post('/posts', async (c) => {
  const body = await c.req.json()
  return c.json(
    { id: 3, ...body, created: true },
    201,
    { 'X-Custom': 'Success' }
  )
})

export default app
```

```typescript
// app.test.ts
import { describe, it, expect } from 'vitest'
import app from './app'

describe('Posts API', () => {
  it('should get all posts', async () => {
    const res = await app.request('/posts')
    
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual([
      { id: 1, title: 'First Post' },
      { id: 2, title: 'Second Post' }
    ])
  })

  it('should create a new post', async () => {
    const newPost = { title: 'New Post', content: 'Content here' }
    
    const res = await app.request('/posts', {
      method: 'POST',
      body: JSON.stringify(newPost),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    expect(res.status).toBe(201)
    expect(res.headers.get('X-Custom')).toBe('Success')
    
    const data = await res.json()
    expect(data).toEqual({
      id: 3,
      title: 'New Post',
      content: 'Content here',
      created: true
    })
  })
})
```

### 2. Using `testClient()` (Type-Safe Approach)

For type-safe testing with autocompletion:

```typescript
// app.ts
import { Hono } from 'hono'

// IMPORTANT: Chain methods directly for type inference
const app = new Hono()
  .get('/search', (c) => {
    const query = c.req.query('q')
    return c.json({ 
      query: query, 
      results: ['result1', 'result2'] 
    })
  })
  .post('/users', async (c) => {
    const user = await c.req.json()
    return c.json({ id: 1, ...user }, 201)
  })

export default app
export type AppType = typeof app
```

```typescript
// app.test.ts
import { describe, it, expect } from 'vitest'
import { testClient } from 'hono/testing'
import app, { type AppType } from './app'

describe('Type-safe API Tests', () => {
  const client = testClient(app)

  it('should search with query parameter', async () => {
    const res = await client.search.$get({
      query: { q: 'hono' }
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      query: 'hono',
      results: ['result1', 'result2']
    })
  })

  it('should create user with headers', async () => {
    const token = 'test-token'
    const userData = { name: 'John', email: 'john@example.com' }

    const res = await client.users.$post(
      { json: userData },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data).toEqual({
      id: 1,
      name: 'John',
      email: 'john@example.com'
    })
  })
})
```

## Testing Different Request Types

### GET Requests with Query Parameters

```typescript
it('should handle query parameters', async () => {
  const res = await app.request('/search?q=test&limit=10')
  expect(res.status).toBe(200)
})
```

### POST Requests with JSON

```typescript
it('should handle JSON body', async () => {
  const payload = { name: 'Test', value: 123 }
  
  const res = await app.request('/api/data', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  expect(res.status).toBe(201)
})
```

### POST Requests with Form Data

```typescript
it('should handle form data', async () => {
  const formData = new FormData()
  formData.append('name', 'test')
  formData.append('file', new Blob(['content'], { type: 'text/plain' }))
  
  const res = await app.request('/upload', {
    method: 'POST',
    body: formData
  })
  
  expect(res.status).toBe(200)
})
```

### Requests with Custom Headers

```typescript
it('should handle custom headers', async () => {
  const res = await app.request('/protected', {
    headers: {
      'Authorization': 'Bearer token123',
      'X-API-Key': 'secret'
    }
  })
  
  expect(res.status).toBe(200)
})
```

## Testing with Environment Variables

For applications that use `c.env` (like Cloudflare Workers):

```typescript
// app.ts
const app = new Hono<{ Bindings: { API_HOST: string; DB: any } }>()

app.get('/config', (c) => {
  return c.json({ host: c.env.API_HOST })
})

// app.test.ts
const MOCK_ENV = {
  API_HOST: 'test.example.com',
  DB: {
    prepare: () => ({ all: () => [] }) // Mock D1 database
  }
}

it('should use environment variables', async () => {
  const res = await app.request('/config', {}, MOCK_ENV)
  
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data.host).toBe('test.example.com')
})
```

## Testing Middleware

### Authentication Middleware

```typescript
// auth.test.ts
import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { jwt } from 'hono/jwt'

const app = new Hono()

app.use('/protected/*', jwt({ secret: 'test-secret' }))
app.get('/protected/data', (c) => {
  return c.json({ message: 'Protected data' })
})

describe('Authentication', () => {
  it('should reject requests without token', async () => {
    const res = await app.request('/protected/data')
    expect(res.status).toBe(401)
  })

  it('should accept requests with valid token', async () => {
    // DO NOT IMPLEMENT BUSINESS LOGIC IN TESTS
    // Instead, use your app's login endpoint to get a real token
    const loginRes = await app.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    expect(loginRes.status).toBe(200)
    const { token } = await loginRes.json()
    
    // Now test the protected endpoint with the real token
    const res = await app.request('/protected/data', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    expect(res.status).toBe(200)
  })
})
```

### CORS Middleware

```typescript
import { cors } from 'hono/cors'

const app = new Hono()
app.use('*', cors())

it('should handle CORS preflight', async () => {
  const res = await app.request('/api/data', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://example.com',
      'Access-Control-Request-Method': 'POST'
    }
  })
  
  expect(res.status).toBe(200)
  expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
})
```

## Database Testing with Drizzle

### Setup Test Database

```typescript
// test-setup.ts
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

export const setupTestDb = () => {
  const sqlite = new Database(':memory:')
  const db = drizzle(sqlite)
  
  // Run migrations
  migrate(db, { migrationsFolder: './drizzle' })
  
  return db
}
```

### Testing Database Operations

```typescript
// users.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestDb } from './test-setup'
import { users } from './schema'
import app from './app'

describe('Users API with Database', () => {
  let db: ReturnType<typeof setupTestDb>
  
  beforeEach(() => {
    db = setupTestDb()
    // Inject test database into your app context
    app.set('db', db)
  })

  it('should create and retrieve user', async () => {
    // Create user
    const createRes = await app.request('/users', {
      method: 'POST',
      body: JSON.stringify({ name: 'John', email: 'john@test.com' }),
      headers: { 'Content-Type': 'application/json' }
    })
    
    expect(createRes.status).toBe(201)
    const created = await createRes.json()
    
    // Verify in database
    const dbUser = await db.select().from(users).where(eq(users.id, created.id))
    expect(dbUser[0]).toMatchObject({
      name: 'John',
      email: 'john@test.com'
    })
    
    // Get user via API
    const getRes = await app.request(`/users/${created.id}`)
    expect(getRes.status).toBe(200)
    
    const retrieved = await getRes.json()
    expect(retrieved).toEqual(created)
  })
})
```

## Error Handling Tests

```typescript
describe('Error Handling', () => {
  it('should handle 404 errors', async () => {
    const res = await app.request('/nonexistent')
    expect(res.status).toBe(404)
  })

  it('should handle validation errors', async () => {
    const res = await app.request('/users', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
      headers: { 'Content-Type': 'application/json' }
    })
    
    expect(res.status).toBe(400)
    const error = await res.json()
    expect(error).toHaveProperty('message')
  })

  it('should handle server errors gracefully', async () => {
    // Test route that throws an error
    const res = await app.request('/error-route')
    expect(res.status).toBe(500)
  })
})
```

## Test Organization Best Practices

### File Structure

```
src/
├── routes/
│   ├── users.ts
│   └── posts.ts
├── __tests__/
│   ├── setup.ts
│   ├── users.test.ts
│   ├── posts.test.ts
│   └── integration.test.ts
├── app.ts
└── index.ts
```

### Test Naming Conventions

```typescript
describe('Users API', () => {
  describe('GET /users', () => {
    it('should return all users', async () => {})
    it('should return empty array when no users', async () => {})
    it('should filter users by query parameter', async () => {})
  })

  describe('POST /users', () => {
    it('should create user with valid data', async () => {})
    it('should reject invalid email format', async () => {})
    it('should reject duplicate email', async () => {})
  })
})
```

## Common Testing Patterns

### Testing Pagination

```typescript
it('should paginate results', async () => {
  // Create test data
  const users = Array.from({ length: 25 }, (_, i) => ({
    name: `User ${i}`,
    email: `user${i}@test.com`
  }))
  
  // Test first page
  const page1 = await app.request('/users?page=1&limit=10')
  const data1 = await page1.json()
  expect(data1.users).toHaveLength(10)
  expect(data1.total).toBe(25)
  
  // Test second page
  const page2 = await app.request('/users?page=2&limit=10')
  const data2 = await page2.json()
  expect(data2.users).toHaveLength(10)
})
```

### Testing File Uploads

```typescript
it('should handle file upload', async () => {
  const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
  const formData = new FormData()
  formData.append('file', file)
  formData.append('description', 'Test file')
  
  const res = await app.request('/upload', {
    method: 'POST',
    body: formData
  })
  
  expect(res.status).toBe(200)
  const result = await res.json()
  expect(result.filename).toBe('test.txt')
})
```

## Debugging Tests

### Logging Responses

```typescript
it('should debug response', async () => {
  const res = await app.request('/debug-endpoint')
  
  console.log('Status:', res.status)
  console.log('Headers:', Object.fromEntries(res.headers.entries()))
  console.log('Body:', await res.text())
  
  expect(res.status).toBe(200)
})
```

### Testing with Real Network Requests

```typescript
// For testing external API integrations
it('should handle external API', async () => {
  const res = await app.request('/proxy/external-data')
  
  expect(res.status).toBe(200)
  // Test that your app properly handles external API responses
})
```

## Running Tests

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ci": "vitest run"
  }
}
```

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run specific test file
bun test users.test.ts

# Run with coverage
bun test:coverage
```

## Key Takeaways

1. **Always test with real HTTP requests** - Don't mock the HTTP layer
2. **Use type-safe testing** - Leverage `testClient()` for better developer experience  
3. **Test the complete request/response cycle** - Include middleware, validation, and database operations
4. **Organize tests by feature/route** - Keep related tests together
5. **Test both success and error cases** - Ensure your error handling works
6. **Use real database operations** - Don't mock the database layer in integration tests
7. **Keep tests focused and independent** - Each test should be able to run in isolation

This approach ensures your Hono applications are thoroughly tested and behave correctly in production environments.
