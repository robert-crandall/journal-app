---
description: Personal development guidelines
applyTo: "**/*"
---

# Personal Development Guidelines

## UI/Design Guidelines

- Use daisyUI for color and theme management
- Support light and dark themes. Support other daisyUI themes as well.
- Use Tailwind CSS v4 for the latest features and performance improvements.
- Use daisyUI 5 for component-based design.
- Target a clean, modern aesthetic with a focus on usability. Examples of good design are Superlist, Linear, and GitHub.
- Use card layouts. Cards should have colored left borders for visual hierarchy and categorization. Cards within one category can have different left border colors to indicate different statuses or types.
- For dashboards, use a two-column layout with a 2:1 ratio (wider left column).
- Add shadow effects and hover states for interactive elements
- Use Lucide Icons (https://lucide.dev) for all icon needs.
- Never use emojis in the UI. Use icons instead.
- Choose semantic icon names that clearly represent their function.
- Use consistent icon sizes throughout the application (typically 16px, 20px, 24px).
- Use modals sparingly. These are good for quick actions. They are not good for complex forms or workflows.
- Use confirmation dialogs for destructive actions only.
- Cards should be linked to their detail view. Do not include a "view" link or button inside the card.

## Target Browsers

- Target mobile-first design principles. Target mobile Safari running on iOS 16+
- Use responsive design techniques to ensure a good experience on all devices.
- Optimize for PWA (Progressive Web App) standards.
- If using a separate backend, the deployment target of the frontend will be Single Page Application (SPA).
- Use a navigation bar that is accessible and easy to use on both desktop and mobile.
- Navigation bar should be sticky at the top of the page on desktop and mobile. It can be on the left side on desktop, but should be at the top on mobile.

## Architecture

- Always enforce end to end type safety using TypeScript.
- Use tRPC for type-safe API calls between frontend and backend.

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
