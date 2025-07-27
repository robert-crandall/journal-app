
# Svelte 5 UI Consistency & DRY Principles

## Core Principles

- **DRY (Don't Repeat Yourself):** Never duplicate layout, header, or container code. Use SvelteKit layouts and shared components.
- **Single Source of Truth:** Place all shared UI (headers, nav, containers) in layout files, not in individual pages.
- **Consistent Structure:** All pages should look and feel the same by inheriting from the same layout.

## Svelte 5 Layout Best Practices

1. **Use Root Layout for Global UI:**
  - Create or update `src/routes/+layout.svelte` to include your global wrappers (e.g., `<PageContainer>`, `<AppHeader>`, nav, etc.).
  - All pages will automatically inherit this structure.

2. **Nested Layouts for Sections:**
  - For areas needing a different layout (e.g., dashboard, marketing), use layout groups: create a folder like `(dashboard)/+layout.svelte`.
  - Only put section-specific wrappers in these nested layouts.

3. **Page Files for Content Only:**
  - Only put unique, page-specific content in `+page.svelte` files. Never repeat headers, containers, or nav here.

4. **Component Reuse:**
  - Place all reusable UI (headers, containers, buttons, etc.) in `$lib` and import them in layouts/pages as needed.

5. **Advanced: Layout Resets & Composition:**
  - Use `+layout@.svelte` or `+page@.svelte` to break out of inherited layouts if needed.
  - Prefer composition (wrapping with reusable components) over copy-pasting markup.

6. **Testing Consistency:**
  - After changes, verify that all pages have consistent headers, containers, and spacing.

# How to Refactor a Page for AppHeader + PageContainer


- [ ] Step 1: Remove any custom header markup (titles, subtitles, icons, badges, etc.) at the top of the page.
- [ ] Step 2: If not already present, add `<AppHeader>` and `<PageContainer>` to the appropriate `+layout.svelte` (root or section-specific).
- [ ] Step 3: Pass `title`, `subtitle`, `icon`, and `buttons` as props to `<AppHeader>` in the layout.
- [ ] Step 4: In your `+page.svelte`, keep only the unique page content. Do **not** include headers or containers.
- [ ] Step 5: Remove any container divs or classes (`max-w-7xl`, `mx-auto`, `px-4`, `py-8`) from the page. The layout handles all of this.
- [ ] Step 6: Test that the header and content are centered, with correct max width and padding, and look consistent with other pages.

---

**References:**
- [SvelteKit Layouts Documentation](https://kit.svelte.dev/docs/layouts)
- [SvelteKit Advanced Routing & Layouts](https://svelte.dev/docs/kit/advanced-routing)
