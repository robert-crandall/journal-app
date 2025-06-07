---
applyTo: "**/*.{svelte,html,css}"
---

# Tailwind CSS 4 Styling Guidelines

Apply these guidelines when working with HTML, Svelte components, and CSS files.

## Tailwind CSS 4 Best Practices

### Setup and Configuration
- Use `@import "tailwindcss";` in CSS files (not the old @tailwind directives)
- Configure theme via `@theme` directive in CSS, not tailwind.config.js
- Use OKLCH colors for better color consistency
- Target modern browsers (Safari 16.4+, Chrome 111+, Firefox 128+)

### Utility Usage
- Follow mobile-first responsive design with breakpoint prefixes
- Use utility classes for spacing, typography, and layout
- Combine utilities effectively (e.g., `flex items-center gap-4`)
- Use arbitrary values sparingly with square bracket notation

### Performance Optimization
- Leverage the new v4 engine's performance improvements
- Use CSS custom properties for theme values
- Avoid unnecessary custom CSS when utilities exist
- Use the `!` suffix only when absolutely necessary for important declarations

### Responsive Design
- Start with mobile styles, then add larger breakpoint prefixes
- Use consistent breakpoint patterns: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Consider container queries for component-based responsive design
- Test across different screen sizes

### Custom Styling
- Define custom theme values in `@theme` blocks
- Use CSS custom properties for reusable values
- Prefer utility composition over custom classes
- Use `@layer` for custom component styles when needed

### Integration with daisyUI
- Use daisyUI component classes as base styles
- Customize daisyUI components with Tailwind utilities
- Follow daisyUI naming conventions for semantic components
- Use theme variables for consistent color schemes

For complete Tailwind CSS utility reference and detailed documentation, see [Tailwind CSS documentation](../references/tailwindcss-llms.md) and [Tailwind CSS 4 documentation](../references/tailwindcss4-llms.md).
