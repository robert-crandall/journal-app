---
applyTo: "frontend/**/*.{svelte,ts,js,html,css}"
---

## 🧭 Design Style Guide

**For apps focused on clarity, reflection, and responsive depth**

### ✨ Design System Origins

This design style draws inspiration from:

* **Material 3**: spacing rhythm, responsive scaling, accessible touch targets
* **Atlassian Design System**: calm emotional tone, semantic use of color, strong information hierarchy
* **Personal Philosophy**: structure over flair, meaning over gamification, space to reflect or act

---

## 🎯 Core Principles

### 1. **Clarity First**

Design prioritizes clarity over cleverness. Layouts are readable at a glance. Font sizes, spacing, and visual hierarchy do the heavy lifting.
*“If you had to squint, it wouldn’t work.”*

### 2. **Emotionally Neutral + Affirming**

Avoids exaggerated praise or "delight-first" interactions. Language affirms effort, respects autonomy, and invites participation.
*“Progress feels like validation, not manipulation.”*

### 3. **Responsive by Default**

Layouts should be mobile-first, accessible, and adapt fluidly to all screen sizes. Transitions reinforce state change, not flash.
*“Responsive means intuitive, not just flexible.”*

### 4. **Progressive Depth**

Every element should be meaningful on first glance, but offer more when explored. Support both simple interactions and deeper engagement.
*“You can graze or dive — both are supported.”*

---

## 🎨 Visual Language

### Color Strategy

* Use **semantic tokens**, not fixed colors: `primary`, `neutral`, `accent`, `success`, etc.
* Color should:

  * Indicate status or intent
  * Unify related components
  * Never overwhelm
* Avoid hardcoded themes — support light/dark theming gracefully

### Spacing + Rhythm

* Vertical spacing should feel **generous but purposeful**

  * e.g., `space-y-4` between stacked blocks
* Use `p-4` or `p-6` for block content; avoid over-tight components
* Support **breathing room** without isolating content

### Corners, Shadows, Borders

* Use `rounded-md` for most elements
* Prefer `shadow-md` for elevation over thick borders
* Use `border-l-4` or soft dividers to **anchor sections** semantically
* Do not over-round, over-shadow, or over-outline

---

## 🔠 Typography

* **Hierarchical, not decorative**

  * Page titles: `text-3xl font-bold`
  * Section titles: `text-xl font-semibold`
  * Paragraphs: `text-sm text-gray-600`
  * Emphasis: `italic`, `opacity-70`
* Use `prose` classes for longer text blocks or structured content
* Emojis and icons should **support**, not replace, meaning

---

## 🧭 Navigation

### Structure

* **Mobile-first** layout
* Hamburger menu on **top-left** for small screens
* Expand to horizontal nav on medium+ screens
* Include:

  * Brand or title (left-aligned)
  * Navigation links (right-aligned or hidden in drawer)
  * Optional CTA or user menu (e.g. avatar dropdown)

### Behavior

* Uses subtle transitions (`transition-opacity`, `transition-transform`)
* Current route should be visually highlighted with font weight or underline

---

## 🧩 Component Patterns

### Cards

* `bg-white rounded-md shadow-md p-6`
* Use `border-l-4` for context markers (e.g., type, status, category)

### Buttons

* Size: `text-sm`, `px-3 py-1.5`
* Shape: `rounded-md`
* Use theme-based backgrounds and hover transitions
* Avoid outlines unless needed for accessibility

### Progress

* Horizontal bars with background + filled indicator (`h-2 rounded-full`)
* Percentages or XP alongside bar

### Lists

* Use vertical spacing and dividers (`divide-y`) for clarity
* Avoid bullets unless necessary — spacing and font should carry structure

---

## 🔁 State Management Patterns

* **Optimistic UI updates**: actions reflect immediately
* Use soft success cues (e.g. fade-in “Saved ✓”) after auto-save or submission
* Errors should be calm but visible (`text-red-500`, never blinking or modal)
* Avoid persistent save buttons when auto-saving is clearer

---

## 🧠 Interaction Philosophy

* Every interaction should have **a visible consequence**
* Avoid modal overload — use modals only for decisions or blocking steps
* Whole-card interactivity is preferred when the card represents an actionable object
* Hover/focus effects should be subtle, not dramatic

---
