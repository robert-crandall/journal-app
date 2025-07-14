---
description: Backend best practices
applyTo: 'backend/**/*.{js,ts}'
---

## PostgreSQL

- Use PostgreSQL as the primary database.
- Use Drizzle ORM for database operations.
- Use `uuid` for primary keys instead of auto-incrementing integers.
- Store all datetime fields as `timestamptz` (timestamp with timezone) in PostgreSQL.
- Always work with UTC in the backend and database layer.
- Convert to user's local timezone only in the presentation layer (frontend).
- Use ISO 8601 format for API responses: `2024-03-15T14:30:00Z`.
- Use libraries like `date-fns-tz` or `Temporal` API for timezone conversions.
- Store user's timezone preference in user settings or detect from browser.
- For recurring events, store timezone information separately from the timestamp.
- Use `Date.now()` or `new Date().toISOString()` for current timestamps.
- Never rely on `new Date()` without timezone information for user-facing dates.
- For date-only fields (birthdays, deadlines), use `date` type in PostgreSQL.
- For date-only fields, do not convert them to or from UTC - keep them as the selected or stored date. For example, create a `parseLocalDate` function that takes a date string in the format `YYYY-MM-DD` and returns a Date object in the local timezone:

```typescript
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
```

## Hono Best Practices

### Framework Philosophy

- Hono is designed to be flexible and fast
- Follow Hono's conventions rather than forcing other framework patterns
- Leverage Hono's built-in features and middleware over external alternatives
- Maintain type safety throughout the application stack

### Project Structure and Organization

#### Avoid Ruby on Rails-style Controllers

**❌ Don't create separate controller functions when possible:**

```typescript
// 🙁 RoR-like Controller - avoid this pattern
const booksList = (c: Context) => {
  return c.json('list books');
};

app.get('/books', booksList);

// Type inference issues
const bookPermalink = (c: Context) => {
  const id = c.req.param('id'); // Can't infer the path param type
  return c.json(`get ${id}`);
};
```

**✅ Write handlers directly after path definitions:**

```typescript
// 😃 Preferred approach
app.get('/books/:id', (c) => {
  const id = c.req.param('id'); // Proper type inference
  return c.json(`get ${id}`);
});
```

**Why:** Direct handlers provide better type inference for path parameters and maintain Hono's type safety benefits.

#### Use Factory Pattern for Reusable Handlers

**✅ When you need reusable logic, use `factory.createHandlers()`:**

```typescript
import { createFactory } from 'hono/factory';
import { logger } from 'hono/logger';

const factory = createFactory();

const middleware = factory.createMiddleware(async (c, next) => {
  c.set('foo', 'bar');
  await next();
});

const handlers = factory.createHandlers(logger(), middleware, (c) => {
  return c.json(c.var.foo);
});

app.get('/api', ...handlers);
```

### Building Larger Applications

#### Use `app.route()` for Modular Architecture

**✅ Separate concerns into different files:**

```typescript
// authors.ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.json('list authors'));
app.post('/', (c) => c.json('create an author', 201));
app.get('/:id', (c) => c.json(`get ${c.req.param('id')}`));

export default app;
```

```typescript
// books.ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.json('list books'));
app.post('/', (c) => c.json('create a book', 201));
app.get('/:id', (c) => c.json(`get ${c.req.param('id')}`));

export default app;
```

```typescript
// index.ts - Main application
import { Hono } from 'hono';
import authors from './authors';
import books from './books';

const app = new Hono();

// Mount routes with proper prefixes
app.route('/authors', authors);
app.route('/books', books);

export default app;
```

#### RPC (Remote Procedure Call) Features

**✅ For type-safe client-server communication:**

```typescript
// authors.ts - Chain methods for RPC compatibility
import { Hono } from 'hono';

const app = new Hono()
  .get('/', (c) => c.json('list authors'))
  .post('/', (c) => c.json('create an author', 201))
  .get('/:id', (c) => c.json(`get ${c.req.param('id')}`));

export default app;
```

```typescript
// client.ts - Type-safe client usage
import app from './authors';
import { hc } from 'hono/client';

const client = hc<typeof app>('http://localhost'); // Fully typed
```

### Middleware Best Practices

#### Use Hono's Built-in Middleware

**✅ Prefer first-party middleware:**

```typescript
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import type { JwtVariables } from 'hono/jwt';

const app = new Hono<{ Variables: JwtVariables }>();

// Chain middleware in logical order
app.use('*', logger());
app.use('*', cors());
app.use('/api/*', jwt({ secret: process.env.JWT_SECRET! }));
```

#### Custom Middleware Pattern

**✅ Create reusable custom middleware:**

```typescript
import { createMiddleware } from 'hono/factory';

const authMiddleware = createMiddleware(async (c, next) => {
  // Custom authentication logic
  const token = c.req.header('Authorization');
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Set context variables
  c.set('userId', extractUserId(token));
  await next();
});

// Use in routes
app.use('/protected/*', authMiddleware);
```

## Hono Stacks

Hono Stacks bundle together tools to help you build a full-stack, type-safe app—from server to client—with minimal boilerplate.

These stacks are essentially:

- **Hono** – your HTTP API server
- **Zod** – for runtime validation
- **@hono/zod-validator** – middleware to integrate Zod
- **hc** – Hono’s HTTP client generator

Put together, they form the **Hono Stack**—a toolkit for consistent, type-safe RPC-style development.

---

### Step 1: Create the API

Write a basic endpoint with Hono:

```ts
import { Hono } from 'hono';
const app = new Hono();

app.get('/hello', (c) => c.json({ message: 'Hello!' }));
```

---

### Step 2: Add Zod validation

Use Zod to ensure correct inputs:

```ts
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

app.get('/hello', zValidator('query', z.object({ name: z.string() })), (c) => {
  const { name } = c.req.valid('query');
  return c.json({ message: `Hello! ${name}` });
});
```

---

### Step 3: Share types for client safety

Export the app's type to let the client know all the routes and types:

```ts
const route = app.get(...validation and handler...)
export type AppType = typeof route
```

💡 **Tip**: Keep routes chained and derived from a single variable for auto-type inference.

---

### Step 4: Build the client

Use `hc<AppType>` to auto-generate a type-safe client:

```ts
import { AppType } from './server';
import { hc } from 'hono/client';

const client = hc<AppType>('/api');

const res = await client.hello.$get({ query: { name: 'Hono' } });
const data = await res.json(); // `data` typed: { message: string }
```

Everything stays in sync—even API changes—without code duplication.

---

### ✨ Step 5: Integrate with React

Hono Stacks work great with React (and tools like React Query):

**API (Cloudflare Pages)**

```ts
// functions/api/[[route]].ts
import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { z, zValidator } from 'hono/zod-validator'

const app = new Hono()
type Todo = z.infer<typeof z.object({ id: z.string(), title: z.string() })>()

const route = app
  .post('/todo', zValidator('form', schema), (c) => {
    // create todo…
  })
  .get((c) => { /* list todos */ })

export type AppType = typeof route
export const onRequest = handle(app, '/api')
```

**Client (React + TanStack Query)**

```tsx
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import { hc } from 'hono/client';
import type { AppType } from '../functions/api/[[route]]';

const client = hc<AppType>('/api');

// Inside component:
const todos = useQuery({
  queryKey: ['todos'],
  queryFn: () => client.todo.$get().then((r) => r.json()),
});
```

You get full type checking and API safety from front to back.

---

## Error Handling

### Use Hono's Error Handling

**✅ Implement proper error responses:**

```typescript
import { HTTPException } from 'hono/http-exception';

app.get('/users/:id', async (c) => {
  const id = c.req.param('id');
  const user = await getUserById(id);

  if (!user) {
    throw new HTTPException(404, { message: 'User not found' });
  }

  return c.json(user);
});

// Global error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});
```

## Validation and Input Handling

### Use Hono's Built-in Validation

**✅ Validate requests with Hono validators:**

```typescript
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

app.post('/users', zValidator('json', createUserSchema), async (c) => {
  const data = c.req.valid('json'); // Typed and validated
  const user = await createUser(data);
  return c.json(user, 201);
});
```

## Security Best Practices

### JWT Authentication

**✅ Use Hono's JWT middleware:**

```typescript
import { jwt, sign, verify } from 'hono/jwt';

// JWT middleware
app.use(
  '/api/*',
  jwt({
    secret: process.env.JWT_SECRET!,
    cookie: 'auth-token', // Optional: use cookies instead of headers
  }),
);

// Sign tokens
app.post('/login', async (c) => {
  // Validate credentials...
  const token = await sign({ userId: user.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 }, process.env.JWT_SECRET!);
  return c.json({ token });
});
```

### CORS Configuration

**✅ Configure CORS properly:**

```typescript
import { cors } from 'hono/cors';

app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);
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
  .delete('/users/:id', deleteUser);

app.route('/api', apiRoutes);
```

### Context Variables

**✅ Use context efficiently:**

```typescript
// Set context variables early in middleware chain
app.use('*', async (c, next) => {
  c.set('requestId', generateRequestId());
  c.set('startTime', Date.now());
  await next();
});

// Access in handlers
app.get('/slow-endpoint', async (c) => {
  const startTime = c.var.startTime;
  // Process...
  const duration = Date.now() - startTime;
  c.header('X-Response-Time', `${duration}ms`);
  return c.json({ data });
});
```

## Testing Integration

### Test with Real HTTP Requests

**✅ Use Hono's testing utilities:**

```typescript
import { testClient } from 'hono/testing';

// Test your app with real HTTP requests
describe('API Tests', () => {
  const client = testClient(app);

  test('GET /users', async () => {
    const res = await client.users.$get();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('POST /users', async () => {
    const res = await client.users.$post({
      json: { name: 'John', email: 'john@example.com' },
    });
    expect(res.status).toBe(201);
  });
});
```

## Development Environment

### Environment Configuration

**✅ Handle environment variables properly:**

```typescript
type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  NODE_ENV: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    env: c.env.NODE_ENV,
    // Don't expose sensitive values
    hasDb: !!c.env.DATABASE_URL,
    hasJwt: !!c.env.JWT_SECRET,
  });
});
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

> Reference: [Complete Hono Documentation](../references/hono-llms.md)
