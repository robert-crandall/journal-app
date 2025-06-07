---
applyTo: "**/*.{svelte,html,css,ts,js}"
---

# daisyUI 5 Component Guidelines

Apply these guidelines when using daisyUI 5 components in HTML and Svelte files.

## daisyUI 5 Best Practices

### Installation and Setup
- Ensure daisyUI 5 is installed with `npm i -D daisyui@latest`
- Add `@plugin "daisyui";` to your CSS file after Tailwind import
- Requires Tailwind CSS 4 - no tailwind.config.js needed
- Use single `@import "tailwindcss";` followed by `@plugin "daisyui";`

### Component Usage
- Use semantic component class names (e.g., `btn`, `card`, `modal`)
- Combine with Tailwind utilities for customization
- Use modifier classes for variants (e.g., `btn-primary`, `btn-lg`)
- Follow the component + part + modifier pattern

### Styling Strategy
- Start with daisyUI component classes as base
- Customize with Tailwind utilities (e.g., `btn px-10`)
- Use `!` suffix for forceful overrides only as last resort
- Prefer daisyUI semantic classes over custom CSS

### Theme Integration
- Use daisyUI's CSS variables for consistent theming
- Leverage built-in color schemes and theme switching
- Customize theme values in your CSS file's `@theme` block
- Use semantic color names (primary, secondary, accent, etc.)

### Component Patterns
- Use `card` for content containers
- Use `btn` for all button elements
- Use `form-control` for form elements
- Use `navbar` for navigation components
- Use `modal` for overlays and dialogs

### Responsive Design
- Combine daisyUI components with Tailwind responsive utilities
- Use responsive prefixes with component classes when needed
- Test component behavior across breakpoints
- Consider mobile-first component design

### Accessibility
- Use daisyUI's built-in accessibility features
- Combine with proper ARIA attributes
- Ensure keyboard navigation works with components
- Test with screen readers

For complete component reference and detailed API information, see [daisyUI documentation](../references/daisyui-llms.md).
