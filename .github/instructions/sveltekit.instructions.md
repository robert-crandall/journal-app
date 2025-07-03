---
description: UI Design Guidelines
applyTo: "frontend/**/*.{js,ts,svelte}"
---

## Overview

This project uses Svelte 5 for frontend. Svelte 5introduces runes, a set of advanced primitives for controlling reactivity. The runes replace certain non-runes features and provide more explicit control over state and effects.

## UI/Design Guidelines

- Use color description (ie, primary) instead of color names (blue), to support easy theming.
- Use daisyUI for color and theme management. [DaisyUI Documentation](https://daisyui.com/llms.txt)
- Use Lucide Icons (https://lucide.dev) for all icon needs.
- Never use emojis in production UI - they're inconsistent across platforms.
- Choose semantic icon names that clearly represent their function.
- Use consistent icon sizes throughout the application (typically 16px, 20px, 24px).
- Use modals sparingly. These are good for quick actions. They are not good for complex forms or workflows.
- Create new pages for edit or new actions instead of using modals or in-line editing.
- Use confirmation dialogs for destructive actions only.
- Cards should be linked to their detail view like mobile apps. Do not include a "view" link or button inside the card.

## Target Browsers

- Target mobile-first design principles. Target mobile Safari running on iOS 16+
- Use responsive design techniques to ensure a good experience on all devices.
- Optimize for PWA (Progressive Web App) standards.
- If using a separate backend, the deployment target of the frontend will be Single Page Application (SPA).
- Use a navigation bar that is accessible and easy to use on both desktop and mobile.

## Architecture

- Always enforce end to end type safety using TypeScript.
- Use tRPC for type-safe API calls between frontend and backend.

## Hono Stacks

Hono Stacks work great with Svelte:

**Client (SvelteKit)**

```tsx
import { hc } from 'hono/client'
import type { AppType } from '../functions/api/[[route]]'

const client = hc<AppType>('/api')

// Inside component:
const todos = useQuery({
  queryKey: ['todos'],
  queryFn: () => client.todo.$get().then(r => r.json()),
})
```

You get full type checking and API safety from front to back.
