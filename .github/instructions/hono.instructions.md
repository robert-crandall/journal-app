---
description: Hono web framework coding standards and best practices for ultrafast web APIs
applyTo: "backend/**/*.{js,ts,jsx,tsx}"
---

# Hono Web Framework Guidelines

> Reference: [Complete Hono Documentation](../references/hono-llms.md)

## Core Principles

- **Web Standards First**: Build on Web Standards APIs for maximum portability across runtimes
- **Multi-Runtime**: Write code that works on Cloudflare Workers, Deno, Bun, Vercel, AWS Lambda, and Node.js
- **Type Safety**: Leverage Hono's excellent TypeScript support with end-to-end type safety
- **Performance**: Use Hono's RegExpRouter for ultrafast routing performance
- **Minimal Bundle Size**: Keep imports lean, use only what you need

## Project Structure

```
src/
  ├── app.ts              # Main Hono app instance
  ├── routes/             # Route handlers organized by feature
  │   ├── api/            # API routes
  │   ├── auth/           # Authentication routes
  │   └── webhooks/       # Webhook handlers
  ├── middleware/         # Custom middleware
  ├── lib/               # Business logic and utilities
  ├── types/             # TypeScript type definitions
  └── bindings.ts        # Environment bindings types
```

## Application Setup

### Basic App Structure
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// Define environment bindings
type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use('*', logger());
app.use('*', cors());
app.use('*', prettyJSON());

// Routes
app.route('/api', apiRoutes);
app.route('/auth', authRoutes);

export default app;
```

### Environment Types
```typescript
// bindings.ts
export type Bindings = {
  // Cloudflare Workers
  DATABASE: D1Database;
  KV: KVNamespace;
  
  // Environment variables
  JWT_SECRET: string;
  API_KEY: string;
};

export type Variables = {
  user: User;
  requestId: string;
};

export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
```

## Routing Patterns

### Route Organization
```typescript
// routes/api/users.ts
import { Hono } from 'hono';
import type { HonoEnv } from '../../bindings';

const users = new Hono<HonoEnv>();

users.get('/', async (c) => {
  // List users
  return c.json({ users: [] });
});

users.get('/:id', async (c) => {
  const id = c.req.param('id');
  // Get user by ID
  return c.json({ user: { id } });
});

users.post('/', async (c) => {
  const body = await c.req.json();
  // Create user
  return c.json({ user: body }, 201);
});

export { users };
```

### Path Parameters and Validation
```typescript
// Use Zod for request validation
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

app.post('/users', 
  zValidator('json', createUserSchema), 
  async (c) => {
    const validated = c.req.valid('json');
    // validated is fully typed
    return c.json({ user: validated }, 201);
  }
);
```

## Context and Request Handling

### Context Usage
```typescript
app.get('/example', async (c) => {
  // Request data
  const param = c.req.param('id');
  const query = c.req.query('filter');
  const header = c.req.header('authorization');
  const body = await c.req.json();
  
  // Environment access
  const secret = c.env.JWT_SECRET;
  const db = c.env.DATABASE;
  
  // Variables (set by middleware)
  const user = c.get('user');
  
  // Response
  return c.json({ data: 'example' });
});
```

### Response Types
```typescript
// JSON responses (most common)
return c.json({ data: result });
return c.json({ error: 'Not found' }, 404);

// Text responses
return c.text('Hello World');

// HTML responses
return c.html('<h1>Hello</h1>');

// Redirects
return c.redirect('/login', 302);

// Stream responses
return c.stream(async (stream) => {
  await stream.write('chunk 1');
  await stream.write('chunk 2');
});
```

## Middleware Patterns

### Custom Middleware
```typescript
// middleware/auth.ts
import type { MiddlewareHandler } from 'hono';
import type { HonoEnv } from '../bindings';

export const authMiddleware = (): MiddlewareHandler<HonoEnv> => {
  return async (c, next) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    try {
      const user = await validateToken(token, c.env.JWT_SECRET);
      c.set('user', user);
      await next();
    } catch {
      return c.json({ error: 'Invalid token' }, 401);
    }
  };
};
```

### Built-in Middleware Usage
```typescript
import { bearerAuth } from 'hono/bearer-auth';
import { basicAuth } from 'hono/basic-auth';
import { jwt } from 'hono/jwt';
import { cache } from 'hono/cache';
import { compress } from 'hono/compress';

// Bearer token auth
app.use('/api/*', bearerAuth({ token: 'secret-token' }));

// JWT auth
app.use('/protected/*', jwt({ secret: 'jwt-secret' }));

// Caching
app.get('/api/data', cache({ cacheName: 'api-data', cacheControl: 'max-age=3600' }));

// Compression
app.use('*', compress());
```

## Error Handling

### Global Error Handler
```typescript
app.onError((err, c) => {
  console.error('Error:', err);
  
  if (err instanceof ValidationError) {
    return c.json({ error: 'Validation failed', details: err.details }, 400);
  }
  
  if (err instanceof NotFoundError) {
    return c.json({ error: 'Resource not found' }, 404);
  }
  
  return c.json({ error: 'Internal server error' }, 500);
});
```

### Route-Level Error Handling
```typescript
app.get('/users/:id', async (c) => {
  try {
    const user = await getUserById(c.req.param('id'));
    return c.json({ user });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return c.json({ error: 'User not found' }, 404);
    }
    throw error; // Let global handler deal with it
  }
});
```

## Type Safety and RPC

### RPC Client Setup
```typescript
// client.ts
import { hc } from 'hono/client';
import type { AppType } from './app';

const client = hc<AppType>('http://localhost:8787');

// Fully typed API calls
const response = await client.api.users.$get();
const users = await response.json(); // Typed automatically
```

### Type-Safe Route Definitions
```typescript
import type { Hono } from 'hono';

const api = new Hono()
  .get('/users', (c) => c.json({ users: [] as User[] }))
  .post('/users', (c) => c.json({ user: {} as User }, 201));

export type ApiType = typeof api;
```

## Testing

### Unit Testing with Hono
```typescript
import { describe, test, expect } from 'vitest';
import app from '../src/app';

describe('API Tests', () => {
  test('GET /api/users returns users list', async () => {
    const res = await app.request('/api/users');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('users');
  });
  
  test('POST /api/users creates user', async () => {
    const userData = { name: 'John', email: 'john@example.com' };
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    expect(res.status).toBe(201);
  });
});
```

## Best Practices

### Performance
- Use `RegExpRouter` (default) for optimal routing performance
- Leverage streaming for large responses
- Implement proper caching strategies with cache middleware
- Use compression middleware for text responses

### Security
- Always validate input with Zod or similar validation library
- Use bearer auth or JWT middleware for protected routes
- Implement CORS properly for browser requests
- Sanitize user input to prevent XSS attacks
- Use secure headers middleware

### Code Organization
- Separate routes into feature-based modules
- Keep middleware in dedicated files
- Use TypeScript interfaces for all data shapes
- Implement proper error boundaries
- Use environment-specific configurations

### Runtime Compatibility
- Avoid Node.js-specific APIs (use Web Standards)
- Test across different runtimes (Cloudflare Workers, Deno, Bun)
- Use Web Streams API for streaming
- Prefer `fetch` over platform-specific HTTP clients
- Use Web Crypto API for cryptographic operations

This instruction set emphasizes Hono's unique strengths: ultrafast performance, multi-runtime compatibility, excellent TypeScript support, and Web Standards compliance.

Reference: [Hono Instructions](../references/hono-llms.md)
