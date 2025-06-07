---
applyTo: "**/*.{svelte,ts,js}"
---

# SvelteKit Development Guidelines

Apply these guidelines when working with SvelteKit components and TypeScript files.

## SvelteKit Best Practices

### Component Structure
- Use functional components with Svelte 5 runes
- Keep components small and focused (under 200 lines)
- Use TypeScript for all component logic
- Structure components with `<script>`, markup, then `<style>`

### Runes Usage
- Use `$state()` for reactive state
- Use `$derived()` for computed values
- Use `$effect()` for side effects (sparingly)
- Use `$props()` with destructuring for component props
- Use `$bindable()` for two-way data binding when needed

### File-based Routing
- Use `+page.svelte` for route components
- Use `+layout.svelte` for shared layouts
- Use `+page.ts` for data loading
- Use `+layout.ts` for layout data

### State Management
- Prefer local component state with `$state()`
- Use stores in `src/lib/stores/` for global state
- Use the existing API client from `src/lib/api.ts`
- Avoid prop drilling - use context for deep component trees

### Styling in Components
- Use Tailwind CSS classes in component markup
- Use daisyUI components when appropriate
- Scope component-specific styles with `<style>` blocks
- Follow mobile-first responsive design patterns

### Performance
- Use `$derived()` instead of `$effect()` for computed values
- Implement proper loading states for async operations
- Use `bind:this` sparingly
- Lazy load heavy components when possible

For complete SvelteKit API reference and detailed documentation, see [SvelteKit documentation](../references/sveltekit-llms.md).
