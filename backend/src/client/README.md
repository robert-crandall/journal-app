# Journal App API Client

A fully type-safe TypeScript client for the Journal App API. This client provides end-to-end type safety, automatic token management, and comprehensive error handling.

## Features

- 🔒 **Full Type Safety** - All API requests and responses are fully typed
- 🚀 **Automatic Token Management** - Handles JWT tokens automatically
- ⚡ **Framework Agnostic** - Works with React, Svelte, Vue, or any TypeScript project
- 🛡️ **Error Handling** - Comprehensive error handling with custom error types
- 📝 **Validation** - Built-in request validation using Zod schemas
- ⏱️ **Request Timeout** - Configurable request timeouts
- 🔧 **Configurable** - Customizable base URL, headers, and timeout settings

## Installation

```bash
# If using as part of the backend project
npm install zod

# If using in a separate frontend project, you'd copy the client files
```

## Quick Start

### Basic Usage

```typescript
import { journalApi, ApiError } from '@journal-app/client';

// Register a new user
try {
  const result = await journalApi.register({
    email: 'user@example.com',
    password: 'securepassword123',
    firstName: 'John',
    lastName: 'Doe'
  });

  if (result.success) {
    console.log('User registered:', result.data?.user);
    // Token is automatically set for future requests
  }
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Registration failed:', error.message);
  }
}

// Login existing user
try {
  const result = await journalApi.login({
    email: 'user@example.com',
    password: 'securepassword123'
  });

  if (result.success) {
    console.log('Logged in:', result.data?.user);
  }
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Login failed:', error.message);
  }
}
```

### Custom Client Configuration

```typescript
import { createJournalApiClient } from '@journal-app/client';

const client = createJournalApiClient({
  baseUrl: 'https://api.myjournal.app',
  timeout: 15000,
  defaultHeaders: {
    'X-Client-Version': '1.0.0',
    'X-Platform': 'web'
  }
});

// Use the custom client
const profile = await client.getProfile();
```

## API Methods

### Authentication

```typescript
// Register new user
await journalApi.register(data);

// Login user
await journalApi.login(credentials);

// Request password reset
await journalApi.requestPasswordReset(email);

// Reset password with token
await journalApi.resetPassword(token, newPassword);

// Logout (clears token)
await journalApi.logout();

// Check if authenticated
const isAuth = journalApi.isAuthenticated();
```

### User Profile

```typescript
// Get current user profile
const profile = await journalApi.getProfile();

// Update user profile
const updatedProfile = await journalApi.updateProfile({
  firstName: 'Jane',
  lastName: 'Smith'
});
```

### User Context

```typescript
// Get user context
const contexts = await journalApi.getContext();

// Update user context
const updatedContexts = await journalApi.updateContext([
  {
    key: 'About me',
    values: ['Software developer', 'Loves TypeScript']
  },
  {
    key: 'Goals',
    values: ['Learn new skills', 'Exercise regularly']
  }
]);
```

### User Preferences

```typescript
// Get user preferences
const preferences = await journalApi.getPreferences();

// Update user preferences
const updatedPrefs = await journalApi.updatePreferences({
  theme: 'dark',
  accentColor: 'purple',
  timezone: 'America/New_York'
});
```

## Framework Integration

### React Hook Example

```typescript
import { useJournalApi } from '@journal-app/client/demo';

function MyComponent() {
  const {
    login,
    logout,
    isAuthenticated,
    getProfile,
    updateProfile
  } = useJournalApi();

  const handleLogin = async () => {
    const result = await login({
      email: 'user@example.com',
      password: 'password'
    });
    
    if (result.success) {
      console.log('Logged in:', result.user);
    } else {
      console.error('Login failed:', result.error);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### SvelteKit Store Example

```typescript
import { authStore } from '@journal-app/client/demo';

// Use in Svelte component
$: user = $authStore.user;
$: isAuthenticated = $authStore.isAuthenticated;

// Login function
const handleLogin = async () => {
  const result = await authStore.login({
    email: 'user@example.com',
    password: 'password'
  });
  
  if (!result.success) {
    console.error('Login failed:', result.error);
  }
};
```

## Type Definitions

The client exports comprehensive TypeScript types:

```typescript
import type {
  ApiResponse,
  User,
  AuthResponse,
  UserContext,
  UserPreferences,
  RegisterInput,
  LoginInput,
  UserContextInput,
  UserPreferencesInput,
  UpdateProfileInput
} from '@journal-app/client';
```

## Error Handling

The client provides a custom `ApiError` class for handling API errors:

```typescript
import { ApiError } from '@journal-app/client';

try {
  await journalApi.someMethod();
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', {
      message: error.message,
      status: error.status,
      response: error.response
    });
    
    // Handle specific error codes
    if (error.status === 401) {
      // Handle authentication error
      await journalApi.logout();
      // Redirect to login
    } else if (error.status === 400) {
      // Handle validation error
      console.error('Validation failed:', error.response);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Request/Response Types

All API methods return a consistent `ApiResponse<T>` structure:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## Configuration Options

```typescript
interface ClientConfig {
  baseUrl?: string;          // Default: 'http://localhost:3001'
  timeout?: number;          // Default: 10000ms
  defaultHeaders?: Record<string, string>;
}
```

## Development

The client is built with TypeScript and provides full type safety. All validation schemas are shared between the client and server, ensuring consistency.

### Building

```bash
cd src/client
npm install
npm run build
```

### Development Mode

```bash
npm run dev  # Starts TypeScript compiler in watch mode
```

## License

This client is part of the Journal App project and follows the same license terms.
