---
applyTo: "**/*.{svelte,ts,js,html,css}"
---

## 🧭 Preferred Design Style Guide

### 🎯 Core UX Principles

* **Immediate, meaningful feedback**
  All interactions should confirm user intent quickly and clearly — using subtle animation and concise messaging.
  *“Feedback should be timely, visible, and obvious without being loud.”*

* **Emotionally grounded tone**
  Use calm, affirming language. Avoid exaggerated praise; instead, acknowledge effort, progress, or clarity.
  *“Encourage the user, don’t cheerlead them.”*

* **Structured clarity with warmth**
  Prioritize chunked, scannable content. Visual warmth comes from spacing, rhythm, and consistent hierarchy — not decoration.
  *“The interface should feel thoughtful, not busy.”*

* **Depth-friendly scaffolding**
  Support both quick interactions and deeper exploration. Present essential information first, with options to explore more.
  *“Support both the quick glance and the slow dive.”*

---

## ⚙️ Interaction Rules

### ✅ Must-Haves

* All interactive elements should **update state immediately**
* Dynamically generated content should integrate seamlessly without requiring manual refresh
* Submission states are clearly communicated with subtle visual cues (e.g., “Saved ✓”)

### ⚠️ Use With Care

* Animation should only reinforce **structure or state change**
* Reinforce progress with simple confirmation — avoid emotionally charged language
* Make the largest logically interactive element clickable (e.g., a card or row)

---

## 🧭 Navigation

### Structure

* **Mobile-first layout**
* **Hamburger menu on the top left** for small screens
* **Expanded horizontal nav** on larger screens (`md` and up)
* Include **branding/title** on the left and navigation items spaced apart

### Behavior

* Navigation should:

  * Be accessible and keyboard navigable
  * Collapse/expand responsively
  * Show active section (underline or font-weight)
  * Avoid over-nesting

### Sample Markup Pattern

```html
<header class="bg-white shadow-md border-b">
  <nav class="container mx-auto px-4 py-3 flex items-center justify-between">
    <!-- Mobile: Hamburger on left -->
    <button class="md:hidden" aria-label="Open menu">
      <!-- Icon SVG here -->
    </button>

    <!-- Brand -->
    <a href="/" class="text-lg font-semibold">App Name</a>

    <!-- Menu (hidden on mobile) -->
    <ul class="hidden md:flex space-x-6 text-sm font-medium">
      <li><a href="/" class="hover:text-theme">Home</a></li>
      <li><a href="/features" class="hover:text-theme">Features</a></li>
      <li><a href="/pricing" class="hover:text-theme">Pricing</a></li>
      <li><a href="/settings" class="hover:text-theme">Settings</a></li>
    </ul>
  </nav>

  <!-- Mobile menu (controlled by toggle state) -->
  <div class="md:hidden px-4 pb-4 space-y-2">
    <a href="/" class="block text-sm">Home</a>
    <a href="/features" class="block text-sm">Features</a>
    <a href="/pricing" class="block text-sm">Pricing</a>
    <a href="/settings" class="block text-sm">Settings</a>
  </div>
</header>
```

---

## 🎨 Visual Design System

### Layout

* **Grid-based** using `gap-*`, `space-y-*`, `container`
* **Cards**: `bg-white rounded-md shadow-md p-4` or `p-6`

### Theming

* Use **semantic colors** (e.g., `theme`, `neutral`, `info`)
* Keep contrast clean, not loud
* Match tone across elements (e.g., button, badge, heading in the same section)

---

## 🔠 Typography

* **Hierarchy with weight + size**:

  * Page title: `text-3xl font-bold`
  * Section: `text-xl font-semibold`
  * Body: `text-sm text-gray-600`
  * Emphasis: `italic`, `opacity-70`
* Use `prose` for structured, longform, or user-generated content

---

## 🧩 Components & Patterns

* Reusable blocks: cards, progress, badges, buttons
* Prefer `rounded-md`, `shadow-md`, and generous padding
* Components should be responsive, accessible, and visually clickable

---

## 🔁 State Behavior

* Use optimistic updates
* Show `"Saved ✓"`, `"Updated"` clearly and gently
* Handle errors with clarity, not alarm
