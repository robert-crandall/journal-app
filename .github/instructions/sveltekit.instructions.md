---
description: SvelteKit 5 coding standards and best practices for fullstack applications
applyTo: "**/*.{js,ts,svelte}"
---

# SvelteKit 5 Development Guidelines

> Reference: [Complete SvelteKit Documentation](../references/sveltekit-llms.md)

## Modern Svelte 5 Component Patterns

### Runes System (Svelte 5+)
- Use `$state()` for reactive state instead of `let` declarations:
  ```svelte
  <script>
    let count = $state(0);
    let user = $state({ name: '', email: '' });
  </script>
  ```

- Use `$derived()` for computed values instead of `$:` reactive declarations:
  ```svelte
  <script>
    let firstName = $state('John');
    let lastName = $state('Doe');
    let fullName = $derived(firstName + ' ' + lastName);
  </script>
  ```

- Use `$effect()` for side effects instead of `$:` statements:
  ```svelte
  <script>
    let count = $state(0);
    
    $effect(() => {
      document.title = `Count: ${count}`;
    });
  </script>
  ```

### Component Props and Events
- Use `$props()` for component props with TypeScript:
  ```svelte
  <script lang="ts">
    interface Props {
      title: string;
      count?: number;
    }
    
    let { title, count = 0 }: Props = $props();
  </script>
  ```

- Use snippets instead of slots for content composition:
  ```svelte
  {#snippet header()}
    <h1>{title}</h1>
  {/snippet}
  
  {@render header()}
  ```

## SvelteKit File Structure and Routing

### Route Files (filesystem-based routing)
- `+page.svelte` - Page component UI
- `+page.server.ts` - Server-only data loading and form actions
- `+page.ts` - Universal data loading (runs on both server and client)
- `+layout.svelte` - Layout wrapper for current directory and subdirectories
- `+layout.server.ts` - Server-only layout data
- `+error.svelte` - Error boundary component
- `+server.ts` - API endpoints (GET, POST, etc.)

### Project Organization
- `src/lib/components/` - Reusable UI components
- `src/lib/server/` - Server-only utilities and database code
- `src/lib/stores/` - Global state management
- `src/lib/utils/` - Shared utilities
- `src/lib/types/` - TypeScript type definitions
- Use `$lib` alias for clean imports: `import { Button } from '$lib/components'`

## Data Loading Patterns

### Load Functions
```typescript
// +page.server.ts - Server-only data loading
export const load = async ({ params, fetch, cookies }) => {
  // Access to cookies, headers, database
  const user = await getUserFromDatabase(cookies.get('session'));
  
  return {
    user,
    posts: await fetch('/api/posts').then(r => r.json())
  };
};
```

```typescript
// +page.ts - Universal data loading
export const load = async ({ params, fetch, parent }) => {
  // Runs on both server and client
  const { user } = await parent();
  
  return {
    posts: await fetch(`/api/users/${user.id}/posts`).then(r => r.json())
  };
};
```

### Data Dependencies
- Use `depends()` to mark external dependencies for cache invalidation
- Use `invalidate()` and `invalidateAll()` for manual cache busting

## Form Handling and Actions

### Form Actions (Server-side)

`redirect` throws an error. Do not use it in a `try/catch` block.
```typescript
// +page.server.ts
export const actions = {
  create: async ({ request, cookies }) => {
    const data = await request.formData();
    const title = data.get('title');
    
    try {
      await createPost({ title, authorId: getCurrentUser(cookies) });
      return { success: true };
    } catch (error) {
      return fail(400, { error: error.message });
    }
  },
  
  delete: async ({ request }) => {
    const data = await request.formData();
    await deletePost(data.get('id'));
    return { success: true };
  }
};
```

### Progressive Enhancement
```svelte
<script>
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  
  let loading = $state(false);
</script>

<form method="POST" action="?/create" use:enhance={() => {
  loading = true;
  return async ({ result, update }) => {
    loading = false;
    await update();
  };
}}>
  <input name="title" required />
  <button disabled={loading}>
    {loading ? 'Creating...' : 'Create Post'}
  </button>
</form>
```

## Navigation and Routing

### Programmatic Navigation
```svelte
<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  function navigateToPost(id: string) {
    goto(`/posts/${id}`);
  }
</script>
```

### Navigation Hooks
```svelte
<script>
  import { beforeNavigate, afterNavigate } from '$app/navigation';
  
  beforeNavigate(({ from, to, cancel }) => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Continue?')) {
        cancel();
      }
    }
  });
  
  afterNavigate(() => {
    // Analytics, focus management, etc.
  });
</script>
```

## State Management

### Global Stores
```typescript
// src/lib/stores/user.ts
import { writable } from 'svelte/store';

interface User {
  id: string;
  name: string;
  email: string;
}

export const user = writable<User | null>(null);
```

### Reactive State with Runes
```svelte
<!-- Component using global state -->
<script>
  import { user } from '$lib/stores/user.ts';
  
  // Subscribe to store
  $: currentUser = $user;
  
  // Or use in runes mode
  let currentUser = $derived($user);
</script>
```

## TypeScript Best Practices

### Page Data Types
```typescript
// app.d.ts
declare global {
  namespace App {
    interface Locals {
      user?: User;
    }
    
    interface PageData {
      user?: User;
    }
    
    interface Error {
      message: string;
      code?: string;
    }
  }
}
```

### Component Typing
```svelte
<script lang="ts">
  interface Props {
    posts: Post[];
    user?: User;
    onSelect?: (post: Post) => void;
  }
  
  let { posts, user, onSelect }: Props = $props();
</script>
```

## Security and Performance

### Server-Side Security
- Keep sensitive operations in `.server.ts` files
- Use `hooks.server.ts` for authentication middleware
- Validate and sanitize all form inputs
- Use CSRF protection for forms

### Performance Optimization
- Use server-side rendering (SSR) by default
- Preload data with `data-sveltekit-preload-data`
- Implement proper caching strategies
- Use adapters optimized for your deployment platform

### Error Handling
```svelte
<!-- +error.svelte -->
<script>
  import { page } from '$app/stores';
</script>

<h1>Error {$page.status}</h1>
<p>{$page.error?.message}</p>

<a href="/">Go home</a>
```

This instruction set focuses on modern SvelteKit 5 patterns with runes, avoiding deprecated `$:` syntax and emphasizing fullstack development best practices.

Reference: [SvelteKit Instructions](../references/sveltekit-llms.md)
