---
description: Tailwind CSS v4 coding standards and best practices
applyTo: "**/*.{css,html,js,jsx,ts,tsx,svelte}"
---

# Tailwind CSS v4 Development Guidelines

> Reference: [Tailwind CSS v4 Documentation](../references/tailwindcss4-llms.md)
> Reference: [Tailwind CSS Full Documentation](../references/tailwindcss-llms.md)

## Core Principles

- **Utility-First Approach**: Style elements by combining single-purpose utility classes directly in HTML
- **Constraint-Based Design**: Use utilities that pull from a predefined design system (theme) for consistency
- **Modern CSS Baseline**: Target Safari 16.4+, Chrome 111+, Firefox 128+ for v4 features
- **Performance-First**: Benefit from drastically reduced build times (sub-10ms for most projects)

## Configuration and Setup

### CSS-First Configuration
- Use `@theme` directive in your main CSS file instead of `tailwind.config.js` for theme values:
```css
/* app.css */
@import "tailwindcss";

@theme {
  --font-sans: "Inter", system-ui, sans-serif;
  --color-brand-500: oklch(0.637 0.237 25.331);
  --breakpoint-lg: 64rem;
  --spacing: 0.25rem;
}
```

### Modern Import Syntax
- Use single `@import "tailwindcss";` instead of separate `@tailwind` directives
- Handles base styles, theme variables, and utilities automatically

### Package Structure
- CLI: `@tailwindcss/cli`
- PostCSS: `@tailwindcss/postcss`
- Vite: `@tailwindcss/vite` (recommended for Vite projects)

## Utility Classes and Patterns

### Responsive Design
- Use mobile-first approach with breakpoint prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Example: `w-16 md:w-32 lg:w-48`

### State Variants
- Apply styles conditionally: `hover:`, `focus:`, `active:`, `disabled:`
- Group interactions: `group-hover:`, `peer-checked:`
- ARIA states: `aria-checked:`, `aria-disabled:`
- Data attributes: `data-[state=open]:`, `data-active:`

### Color and Opacity
- Use slash syntax for opacity: `bg-black/50` (not `bg-opacity-50`)
- Leverage OKLCH colors for better perceptual uniformity
- Use `currentColor` for dynamic color inheritance

### Arbitrary Values
- Use square brackets for one-off values: `top-[117px]`, `bg-[#bada55]`
- Use underscores for spaces: `grid-cols-[1fr_500px_2fr]`
- Use parentheses for CSS variables: `bg-(--my-brand-color)`

## Advanced Features

### Container Queries
- Enable with `@container` class on parent element
- Use size-based variants: `@sm:`, `@lg:`, `@min-[475px]:`
- Named containers: `@container/sidebar`, `@lg/sidebar:`

### Custom Utilities
- Use `@utility` directive for custom, variant-aware utilities:
```css
@utility btn-primary {
  background-color: var(--color-brand-500);
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--radius-md);
}
```

### Scoped Styles Integration
- Use `@reference` in Vue SFCs, Svelte components, or CSS Modules:
```css
/* In component style block */
@reference "../app.css";
```
- Alternatively, use CSS variables directly: `var(--color-brand-500)`

## Migration from v3

### Key Changes
- Shadow scale: `shadow` → `shadow-sm`, `shadow-sm` → `shadow-xs`
- Ring default: `ring` now `1px` (was `3px`), use `ring-3` for old behavior
- Border default: now `currentColor` (was `gray-200`)
- Space utilities: now use `:not(:last-child)` selector

### Deprecated Features
- `@tailwind` directives → `@import "tailwindcss"`
- `bg-opacity-*` → `bg-black/50`
- `theme()` function → `var(--css-variable)`
- Preprocessors (Sass/Less) → use native CSS features

## Best Practices

### Performance
- Leverage v4's new engine for faster builds
- Use `@source` directive to explicitly manage file scanning
- Avoid unnecessary arbitrary values when theme values exist

### Maintainability
- Keep utility classes complete and unambiguous
- Use consistent naming patterns for custom theme variables
- Organize theme variables by namespace: `--color-*`, `--font-*`, `--spacing-*`

### Accessibility
- Use ARIA and data attribute variants for interactive states
- Maintain proper contrast ratios with OKLCH colors
- Test responsive breakpoints across devices

### Code Organization
- Define theme variables in a separate CSS file for reusability
- Use `@utility` for repeated patterns across components
- Group related utilities logically in HTML class lists

## Common Patterns

### Layout
- Flexbox: `flex items-center justify-between`
- Grid: `grid grid-cols-12 gap-4`
- Container queries: `@container @lg:grid-cols-2`

### Typography
- Responsive text: `text-sm md:text-base lg:text-lg`
- With custom fonts: `font-sans` (defined in theme)

### Interactive Elements
- Buttons: `hover:bg-blue-600 focus:ring-2 focus:ring-blue-500`
- Forms: `focus:border-blue-500 focus:ring-blue-500`

### Dark Mode
- Use `dark:` variant: `bg-white dark:bg-gray-900`
- Ensure proper contrast in both modes
