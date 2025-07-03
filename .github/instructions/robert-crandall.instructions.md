---
description: Personal development guidelines
applyTo: "**/*"
---

# Journal App Design System

## UI/Design Guidelines

### Core Design Principles
- Implement a clean, modern dashboard-centric layout
- Create a cohesive experience with consistent spacing, typography, and component styling
- Support both light and dark modes with appropriate contrast ratios
- Design for focus and readability to enhance the journaling experience

### Color System
- **Primary**: Blue shade (`oklch(0.637 0.237 25.331)`) for primary actions and branding
- **Secondary**: Purple (`oklch(0.637 0.237 330)`) for secondary elements
- **Accent**: Green (`oklch(0.7 0.2 140)`) for success states and highlights
- **Dark mode**: Implement true dark mode with proper color mapping, not just inverted colors
- **Color semantics**: 
  - Green for success/completion
  - Blue for information/progress
  - Purple for special features
  - Use color to communicate meaning, not just for decoration

### Typography
- Use **Inter** as the primary font family with system fallbacks
- Text hierarchy:
  - H1: 2rem (32px), bold for main page titles
  - H2: 1.5rem (24px), semibold for section headers
  - H3: 1.25rem (20px), semibold for card titles
  - Body: 1rem (16px), regular weight for main content
  - Small: 0.875rem (14px) for secondary information
- Maintain consistent line heights (1.5 for body text, 1.2 for headings)
- Ensure proper text contrast (WCAG AA minimum)

### Component Library
- Implement shadcn/ui components for a consistent look and feel:
  - **Cards**: Rounded corners (0.5rem), subtle shadows, clear hierarchy
  - **Buttons**: Clear hover states, consistent padding, appropriate sizing
  - **Forms**: Clean inputs with proper validation states
  - **Progress indicators**: For XP, levels, and challenge completion
  - **Navigation**: Clean sidebar with clear active states
- Cards should serve as containers for related information with consistent padding
- Use left-border accents on cards to indicate categories or states

### Icons & Visual Elements
- Use Lucide Icons (https://lucide.dev) exclusively
- Maintain consistent icon sizes (16px for inline, 20px for buttons, 24px for features)
- Prefer outline icons over filled for better visual hierarchy
- Never use emojis in production UI - they're inconsistent across platforms
- Use decorative elements sparingly - focus on clarity and readability

### Layout & Spacing
- Implement a dashboard grid layout for the main view
- Cards should have consistent spacing (1.5rem between sections)
- Use consistent padding within components (1rem standard padding)
- Ensure mobile responsiveness with appropriate breakpoints:
  - Mobile: Up to 640px
  - Tablet: 641px - 1023px
  - Desktop: 1024px and above
- Maintain proper white space to enhance readability

### Interaction Design
- Implement subtle hover effects like the `.hover-lift` class
- Use focus states that are obvious but not distracting
- Animate transitions smoothly (0.2s standard duration)
- Provide clear feedback for user actions (loading states, success confirmations)
- Use modals sparingly - only for focused actions that require immediate attention

## Dark Mode Implementation
- Use CSS variables for all colors to support theme switching
- Implement proper dark mode that respects user system preferences
- Dark mode colors should reduce eye strain while maintaining brand identity
- Test all interface elements in both modes for proper contrast and readability
- Use `prefers-color-scheme` media query along with a manual toggle option

```css
/* Example dark mode CSS structure */
:root {
  /* Light theme variables */
  --bg-primary: white;
  --text-primary: oklch(0.25 0.01 0);
  --card-bg: white;
  --border-color: oklch(0.9 0.03 0);
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark theme variables */
    --bg-primary: oklch(0.2 0.02 240);
    --text-primary: oklch(0.9 0.03 0);
    --card-bg: oklch(0.25 0.02 240);
    --border-color: oklch(0.3 0.03 0);
  }
}

/* For manual toggle */
[data-theme="dark"] {
  /* Same dark mode variables as above */
}
```

## Target Browsers

- Target mobile-first design principles with mobile Safari (iOS 16+) as baseline
- Ensure responsive layouts that adapt to all screen sizes
- Optimize for PWA (Progressive Web App) standards
- Implement a navigation system that works well on both desktop and mobile

## Architecture

- Always enforce end-to-end type safety using TypeScript
- Use Hono clients for type-safe API calls between frontend and backend
- Implement proper state management with Svelte stores
- Create reusable components to maintain design consistency

## PostgreSQL

- Use PostgreSQL as the primary database
- Use Drizzle ORM for database operations
- Use `uuid` for primary keys instead of auto-incrementing integers
- Store all datetime fields as `timestamptz` (timestamp with timezone) in PostgreSQL
- Always work with UTC in the backend and database layer
- Convert to user's local timezone only in the presentation layer (frontend)
- Use ISO 8601 format for API responses: `2024-03-15T14:30:00Z`
- Use libraries like `date-fns-tz` or `Temporal` API for timezone conversions
- Store user's timezone preference in user settings or detect from browser
- For recurring events, store timezone information separately from the timestamp
- Use `Date.now()` or `new Date().toISOString()` for current timestamps
- Never rely on `new Date()` without timezone information for user-facing dates
- For date-only fields (birthdays, deadlines), use `date` type in PostgreSQL
- For date-only fields, do not convert them to or from UTC - keep them as the selected or stored date. For example, create a `parseLocalDate` function that takes a date string in the format `YYYY-MM-DD` and returns a Date object in the local timezone:

```typescript
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
```
