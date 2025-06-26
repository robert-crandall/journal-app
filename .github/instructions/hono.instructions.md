---
description: Hono best practices
applyTo: "backend/**/*.{js,ts}"
---

# Hono Instructions

## Core Principles

### Framework Philosophy
- Hono is designed to be flexible and fast
- Follow Hono's conventions rather than forcing other framework patterns
- Leverage Hono's built-in features and middleware over external alternatives
- Maintain type safety throughout the application stack

## Project Structure and Organization

### Avoid Ruby on Rails-style Controllers
**❌ Don't create separate controller functions when possible:**
```typescript
// 🙁 RoR-like Controller - avoid this pattern
const booksList = (c: Context) => {
  return c.json('list books')
}

app.get('/books', booksList)

// Type inference issues
const bookPermalink = (c: Context) => {
  const id = c.req.param('id') // Can't infer the path param type
  return c.json(`get ${id}`)
}
```

**✅ Write handlers directly after path definitions:**
```typescript
// 😃 Preferred approach
app.get('/books/:id', (c) => {
  const id = c.req.param('id') // Proper type inference
  return c.json(`get ${id}`)
})
```

**Why:** Direct handlers provide better type inference for path parameters and maintain Hono's type safety benefits.

### Use Factory Pattern for Reusable Handlers
**✅ When you need reusable logic, use `factory.createHandlers()`:**
```typescript
import { createFactory } from 'hono/factory'
import { logger } from 'hono/logger'

const factory = createFactory()

const middleware = factory.createMiddleware(async (c, next) => {
  c.set('foo', 'bar')
  await next()
})

const handlers = factory.createHandlers(logger(), middleware, (c) => {
  return c.json(c.var.foo)
})

app.get('/api', ...handlers)
```

## Building Larger Applications

### Use `app.route()` for Modular Architecture
**✅ Separate concerns into different files:**

```typescript
// authors.ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.json('list authors'))
app.post('/', (c) => c.json('create an author', 201))
app.get('/:id', (c) => c.json(`get ${c.req.param('id')}`))

export default app
```

```typescript
// books.ts  
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.json('list books'))
app.post('/', (c) => c.json('create a book', 201))
app.get('/:id', (c) => c.json(`get ${c.req.param('id')}`))

export default app
```

```typescript
// index.ts - Main application
import { Hono } from 'hono'
import authors from './authors'
import books from './books'

const app = new Hono()

// Mount routes with proper prefixes
app.route('/authors', authors)
app.route('/books', books)

export default app
```

### RPC (Remote Procedure Call) Features
**✅ For type-safe client-server communication:**

```typescript
// authors.ts - Chain methods for RPC compatibility
import { Hono } from 'hono'

const app = new Hono()
  .get('/', (c) => c.json('list authors'))
  .post('/', (c) => c.json('create an author', 201))
  .get('/:id', (c) => c.json(`get ${c.req.param('id')}`))

export default app
```

```typescript
// client.ts - Type-safe client usage
import app from './authors'
import { hc } from 'hono/client'

const client = hc<typeof app>('http://localhost') // Fully typed
```

## Middleware Best Practices

### Use Hono's Built-in Middleware
**✅ Prefer first-party middleware:**
```typescript
import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import type { JwtVariables } from 'hono/jwt'

const app = new Hono<{ Variables: JwtVariables }>()

// Chain middleware in logical order
app.use('*', logger())
app.use('*', cors())
app.use('/api/*', jwt({ secret: process.env.JWT_SECRET! }))
```

### Custom Middleware Pattern
**✅ Create reusable custom middleware:**
```typescript
import { createMiddleware } from 'hono/factory'

const authMiddleware = createMiddleware(async (c, next) => {
  // Custom authentication logic
  const token = c.req.header('Authorization')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  // Set context variables
  c.set('userId', extractUserId(token))
  await next()
})

// Use in routes
app.use('/protected/*', authMiddleware)
```

## Type Safety and Hono Stacks

### Define Proper Types
**✅ Use Hono's type system for end-to-end type safety:**
```typescript
type AppBindings = {
  Variables: {
    userId: string
    user: User
  }
  Bindings: {
    DATABASE_URL: string
    JWT_SECRET: string
  }
}

const app = new Hono<AppBindings>()

app.get('/profile', (c) => {
  const userId = c.var.userId // Fully typed
  const dbUrl = c.env.DATABASE_URL // Fully typed
  return c.json({ userId })
})
```

### Export Types for Frontend
**✅ Enable frontend type safety:**
```typescript
// Export the app type for frontend usage
export type AppType = typeof app
export default app
```

```typescript
// Frontend usage with full type safety
import type { AppType } from '../backend/src/index'
import { hc } from 'hono/client'

const client = hc<AppType>('/api')
const response = await client.profile.$get() // Fully typed response
```

## Error Handling

### Use Hono's Error Handling
**✅ Implement proper error responses:**
```typescript
import { HTTPException } from 'hono/http-exception'

app.get('/users/:id', async (c) => {
  const id = c.req.param('id')
  const user = await getUserById(id)
  
  if (!user) {
    throw new HTTPException(404, { message: 'User not found' })
  }
  
  return c.json(user)
})

// Global error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal Server Error' }, 500)
})
```

## Validation and Input Handling

### Use Hono's Built-in Validation
**✅ Validate requests with Hono validators:**
```typescript
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive().optional()
})

app.post('/users', 
  zValidator('json', createUserSchema),
  async (c) => {
    const data = c.req.valid('json') // Typed and validated
    const user = await createUser(data)
    return c.json(user, 201)
  }
)
```

## Security Best Practices

### JWT Authentication
**✅ Use Hono's JWT middleware:**
```typescript
import { jwt, sign, verify } from 'hono/jwt'

// JWT middleware
app.use('/api/*', jwt({
  secret: process.env.JWT_SECRET!,
  cookie: 'auth-token' // Optional: use cookies instead of headers
}))

// Sign tokens
app.post('/login', async (c) => {
  // Validate credentials...
  const token = await sign(
    { userId: user.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 },
    process.env.JWT_SECRET!
  )
  return c.json({ token })
})
```

### CORS Configuration
**✅ Configure CORS properly:**
```typescript
import { cors } from 'hono/cors'

app.use('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}))
```

## Performance Considerations

### Efficient Routing
**✅ Organize routes for optimal performance:**
```typescript
// Group related routes
const apiRoutes = new Hono()
  .get('/users', getAllUsers)
  .post('/users', createUser)
  .get('/users/:id', getUser)
  .put('/users/:id', updateUser)
  .delete('/users/:id', deleteUser)

app.route('/api', apiRoutes)
```

### Context Variables
**✅ Use context efficiently:**
```typescript
// Set context variables early in middleware chain
app.use('*', async (c, next) => {
  c.set('requestId', generateRequestId())
  c.set('startTime', Date.now())
  await next()
})

// Access in handlers
app.get('/slow-endpoint', async (c) => {
  const startTime = c.var.startTime
  // Process...
  const duration = Date.now() - startTime
  c.header('X-Response-Time', `${duration}ms`)
  return c.json({ data })
})
```

## Testing Integration

### Test with Real HTTP Requests
**✅ Use Hono's testing utilities:**
```typescript
import { testClient } from 'hono/testing'

// Test your app with real HTTP requests
describe('API Tests', () => {
  const client = testClient(app)
  
  test('GET /users', async () => {
    const res = await client.users.$get()
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })
  
  test('POST /users', async () => {
    const res = await client.users.$post({
      json: { name: 'John', email: 'john@example.com' }
    })
    expect(res.status).toBe(201)
  })
})
```

## Development Environment

### Environment Configuration
**✅ Handle environment variables properly:**
```typescript
type Bindings = {
  DATABASE_URL: string
  JWT_SECRET: string
  NODE_ENV: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/health', (c) => {
  return c.json({ 
    status: 'ok',
    env: c.env.NODE_ENV,
    // Don't expose sensitive values
    hasDb: !!c.env.DATABASE_URL,
    hasJwt: !!c.env.JWT_SECRET
  })
})
```

## Common Anti-patterns to Avoid

### ❌ Don't Force Express.js Patterns
```typescript
// Don't try to recreate Express middleware patterns
// Use Hono's built-in middleware instead
```

### ❌ Don't Ignore Type Safety
```typescript
// Don't use 'any' types - leverage Hono's type system
// Don't skip validation - use Hono's validators
```

### ❌ Don't Create Unnecessary Abstractions
```typescript
// Don't create complex class hierarchies
// Keep it simple with Hono's functional approach
```

## Summary

1. **Embrace Hono's Philosophy**: Use direct handlers, avoid unnecessary abstractions
2. **Leverage Type Safety**: Use Hono's type system for end-to-end safety
3. **Modular Architecture**: Use `app.route()` for larger applications
4. **Built-in Features**: Prefer Hono's middleware and utilities
5. **RPC Integration**: Chain methods for type-safe client-server communication
6. **Proper Error Handling**: Use HTTPException and global error handlers
7. **Security**: Use Hono's JWT and CORS middleware
8. **Testing**: Write integration tests with real HTTP requests

Following these practices ensures your Hono application is maintainable, type-safe, and performant while staying true to Hono's design philosophy.

> Reference: [Complete Hono Documentation](../references/hono-llms.md)
