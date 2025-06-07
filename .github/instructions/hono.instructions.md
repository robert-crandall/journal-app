---
applyTo: "backend/**/*.ts"
---

# Hono Backend Development Guidelines

Apply these guidelines when working with Hono backend TypeScript files.

## Hono Best Practices

### API Structure
- Follow RESTful conventions for endpoint naming
- Use proper HTTP status codes
- Group related routes in separate files under `src/routes/`
- Use middleware for cross-cutting concerns

### Route Handlers
- Keep route handlers focused and simple
- Use async/await for database operations
- Implement proper error handling with try/catch
- Return consistent JSON response formats

### Middleware Usage
- Use authentication middleware for protected routes
- Implement request validation middleware
- Use CORS middleware appropriately
- Log requests and errors for debugging

### Database Integration
- Use the Drizzle ORM for all database operations
- Follow the existing schema patterns
- Use transactions for multi-step operations
- Handle database errors gracefully

### Authentication & Security
- Validate all user inputs
- Use secure session management
- Implement proper authorization checks
- Sanitize data before database operations

### Error Handling
- Use Hono's built-in error handling
- Provide meaningful error messages
- Log errors with contextual information
- Return appropriate HTTP status codes

### Performance
- Use database connection pooling
- Implement caching where appropriate
- Optimize database queries
- Use compression middleware

For complete Hono API reference and detailed documentation, see [Hono documentation](../references/hono-llms.md).
