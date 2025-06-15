---
description: daisyUI 5 coding standards and best practices for component-based design
applyTo: "**/*.{html,js,jsx,ts,tsx,svelte}"
---

# daisyUI 5 Development Guidelines

> Reference: [Complete daisyUI 5 Documentation](../references/daiyui-llms.md)

## Setup and Installation

### Installation with Tailwind CSS 4
- Install daisyUI 5: `npm i -D daisyui@latest`
- Add to your CSS file (no `tailwind.config.js` needed):
```css
@import "tailwindcss";
@plugin "daisyui";
```

### Theme Configuration
```css
@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
  logs: true;
}
```

## Core Design Principles

### Component-First Approach
- Use daisyUI component classes as the foundation: `btn`, `card`, `modal`, etc.
- Customize with Tailwind utilities: `btn px-10`, `card shadow-xl`
- Only use `!` suffix for overriding when necessary: `btn bg-red-500!`

### Semantic Color System
- Prefer daisyUI semantic colors over Tailwind colors:
  - ✅ `bg-primary`, `text-base-content`
  - ❌ `bg-blue-500`, `text-gray-800`
- Use semantic colors for theme compatibility:
  - `primary`, `secondary`, `accent` for brand colors
  - `base-100`, `base-200`, `base-300` for surfaces
  - `success`, `warning`, `error`, `info` for states

### Responsive Design
- Make layouts responsive with Tailwind prefixes:
  - `flex lg:grid` for layout changes
  - `sm:footer-horizontal` for component variants
  - `lg:drawer-open` for conditional visibility

## Component Usage Patterns

### Buttons
```html
<!-- Basic button -->
<button class="btn btn-primary">Primary</button>

<!-- Button variants -->
<button class="btn btn-outline btn-primary">Outline</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-link">Link</button>

<!-- Button sizes and modifiers -->
<button class="btn btn-lg btn-wide">Large Wide</button>
<button class="btn btn-circle btn-primary">
  <svg>...</svg>
</button>
```

### Cards
```html
<div class="card bg-base-100 shadow-xl">
  <figure>
    <img src="https://picsum.photos/400/225" alt="Description" />
  </figure>
  <div class="card-body">
    <h2 class="card-title">Card Title</h2>
    <p>Card description content...</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Action</button>
    </div>
  </div>
</div>
```

### Forms and Inputs
```html
<!-- Input with label -->
<label class="input input-bordered flex items-center gap-2">
  <span class="label">Email</span>
  <input type="email" placeholder="user@example.com" />
</label>

<!-- Floating label -->
<label class="floating-label">
  <input type="text" placeholder="Username" class="input input-bordered" />
  <span>Username</span>
</label>

<!-- Form validation -->
<input type="email" class="input input-bordered validator" required />
<p class="validator-hint">Please enter a valid email</p>
```

### Navigation Components
```html
<!-- Navbar -->
<div class="navbar bg-base-100">
  <div class="navbar-start">
    <div class="dropdown">
      <div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
        <svg>...</svg>
      </div>
      <ul class="menu menu-sm dropdown-content">
        <li><a>Home</a></li>
        <li><a>About</a></li>
      </ul>
    </div>
  </div>
  <div class="navbar-center">
    <a class="btn btn-ghost text-xl">Brand</a>
  </div>
  <div class="navbar-end">
    <button class="btn btn-primary">Login</button>
  </div>
</div>

<!-- Drawer for mobile navigation -->
<div class="drawer lg:drawer-open">
  <input id="drawer-toggle" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content">
    <!-- Page content -->
  </div>
  <div class="drawer-side">
    <label for="drawer-toggle" class="drawer-overlay"></label>
    <ul class="menu p-4 w-80 min-h-full bg-base-200">
      <li><a>Menu Item</a></li>
    </ul>
  </div>
</div>
```

### Modals and Overlays
```html
<!-- Modern dialog modal -->
<button class="btn" onclick="my_modal.showModal()">Open Modal</button>
<dialog id="my_modal" class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Modal Title</h3>
    <p class="py-4">Modal content goes here.</p>
    <div class="modal-action">
      <form method="dialog">
        <button class="btn">Close</button>
      </form>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
```

### Data Display
```html
<!-- Stats -->
<div class="stats shadow">
  <div class="stat">
    <div class="stat-title">Total Users</div>
    <div class="stat-value">31K</div>
    <div class="stat-desc">21% more than last month</div>
  </div>
</div>

<!-- Table -->
<div class="overflow-x-auto">
  <table class="table table-zebra">
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>John Doe</td>
        <td>john@example.com</td>
        <td>Admin</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Advanced Patterns

### Theme Switching
```html
<!-- Theme controller -->
<div class="dropdown">
  <div tabindex="0" role="button" class="btn">
    Theme
  </div>
  <ul class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
    <li>
      <input type="radio" name="theme-dropdown" 
             class="theme-controller btn btn-sm btn-block" 
             aria-label="Light" value="light" />
    </li>
    <li>
      <input type="radio" name="theme-dropdown" 
             class="theme-controller btn btn-sm btn-block" 
             aria-label="Dark" value="dark" />
    </li>
  </ul>
</div>
```

### Loading States
```html
<!-- Loading spinner -->
<button class="btn btn-primary">
  <span class="loading loading-spinner"></span>
  Loading...
</button>

<!-- Skeleton loader -->
<div class="skeleton h-32 w-full"></div>
<div class="skeleton h-4 w-28"></div>
```

### Interactive Components
```html
<!-- Accordion -->
<div class="collapse collapse-arrow bg-base-200">
  <input type="radio" name="accordion" checked="checked" />
  <div class="collapse-title text-xl font-medium">
    Section Title
  </div>
  <div class="collapse-content">
    <p>Section content goes here.</p>
  </div>
</div>

<!-- Tabs with content -->
<div role="tablist" class="tabs tabs-lifted">
  <input type="radio" name="tabs" role="tab" class="tab" aria-label="Tab 1" checked />
  <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6">
    <h3>Tab 1 Content</h3>
  </div>
</div>
```

## Best Practices

### Accessibility
- Use proper ARIA attributes: `role="alert"`, `aria-label`, `aria-valuenow`
- Include `role="button"` and `tabindex="0"` for interactive elements
- Use semantic HTML elements when possible
- Provide alternative text for images and icons

### Performance
- Use placeholder images: `https://picsum.photos/400/300`
- Avoid custom fonts unless necessary
- Don't add `bg-base-100 text-base-content` to body unless needed
- Leverage daisyUI's built-in responsive utilities

### Code Organization
- Group related components logically
- Use consistent naming for form elements and IDs
- Prefer component classes over utility-only approaches
- Use join for grouping related elements: `<div class="join">`

### Color and Theming
- Stick to semantic color names for consistency
- Use `*-content` colors for proper contrast
- Test designs across light and dark themes
- Use `base-*` colors for page backgrounds and `primary` for important elements

### Layout Patterns
- Use CSS Grid and Flexbox with responsive prefixes
- Implement mobile-first responsive design
- Use drawer pattern for mobile navigation
- Apply consistent spacing with daisyUI's built-in scales

This instruction set emphasizes component-driven development with daisyUI 5 while maintaining design system consistency and accessibility standards.

Reference: [DaisyUI Instructions](../references/daisyui-llms.md)
