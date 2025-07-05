---
description: SvelteKit 5 best practices and patterns for modern web applications
applyTo: '**/*.{js,ts,svelte}'
---

# 🧭 Copilot Instructions: SvelteKit 2 and Svelte 5

## 🔧 Overview

This document outlines development best practices for building the AI Life Coaching App using **SvelteKit** on the backend. This stack is chosen to maximize speed, simplicity, and modern full-stack integration.

---

## ⚙️ SvelteKit Architecture Principles

- Treat each **feature as a module** (routes + components + logic grouped together)
- Keep components **small and single-purpose**
- Move all data and logic into **`lib/server/`** and **`lib/db/`**
- Use **load functions** and **actions** for API-like behavior
- Use **SvelteKit forms** for progressive enhancement (works without JS)
- Favor **form actions over REST endpoints** unless API is needed

## 🔄 Svelte 5 Migration Patterns

### **DEPRECATED: `$app/stores` → Modern: `$props()` for Page Data**

- **DON'T use `$app/stores` for accessing page data** - deprecated in Svelte 5
- **DO use `$props()` to access page and form data** - modern Svelte 5 pattern

```typescript
// ❌ DEPRECATED: Using stores (Svelte 4 pattern)
import { page } from '$app/stores';
$effect(() => {
	if ($page.form?.success) {
		// Handle form success
	}
});

// ✅ MODERN: Using props (Svelte 5 pattern)
let { data, form }: { data: PageData; form: ActionData } = $props();
$effect(() => {
	if (form?.success) {
		// Handle form success
	}
});
```

### **Form Data Access Pattern**

```typescript
// ✅ DO: Access form data through props
<script lang="ts">
  import type { PageData, ActionData } from './$types.js';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // Watch for form state changes
  $effect(() => {
    if (form?.success) {
      // Auto-close forms, reset state, etc.
      showCreateForm = false;
    }
    if (form?.error) {
      // Handle form errors
      console.error(form.error);
    }
  });
</script>
```

### **Common Migration Issues**

- **Form submission stuck in loading state** - Often caused by using deprecated stores
- **Page data not reactive** - Migrate from `$page.data` to `data` prop
- **Form results not updating** - Migrate from `$page.form` to `form` prop

---

## 🗃 Recommended Structure

```
/src
  /routes
    /dashboard
    /stats
    /quests
    /example
  /lib
    /components
    /server
    /db
    /gpt
    /slack
/tests
```

---

## Database and Timezone Management

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

---

## ✅ Development Best Practices

- Use **small components** and colocate files by feature
- Avoid shared global state unless necessary; prefer stores scoped to components
- Type everything (SvelteKit + TypeScript FTW)
- Test all user flows using Playwright

---

Code Reminders

- Using `on:click` to listen to the click event is deprecated. Use the event attribute `onclick` instead

---

## 🧪 Testing

- Write unit tests for utility functions and complex logic
- Implement end-to-end tests using Playwright for critical user flows
- Do not test components. Use end-to-end tests to verify component behavior in the context of the application
