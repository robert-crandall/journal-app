---
applyTo: "**/*.{svelte,ts,js,html,css}"
---

# 🎨 Style Guide

**For: INTJ, ADHD, PWA-first, Mobile & Desktop Compatible**

This guide defines how the app should look and feel. It is optimized for **calm focus**, **zero-friction tasking**, and future **themeability**.

---

## 🌍 Platform Philosophy

* **PWA-first**, but designed to feel like a native iOS app
* **Responsive** across mobile, tablet, and desktop
* **INTJ design values**: calm, functional, minimal but not sterile
* **ADHD-friendly**: instant feedback, reduced mental load, low-friction UI
* **Future-proofing**:

  * Write **semantic, themeable utility classes** (e.g., `action-button`, `tappable-card`)
  * Avoid Tailwind color utility classes in markup (`bg-teal-600`) — use class aliases instead (`btn-primary`, `card-shadow`)

---

### 📦 Cards

* Use `tappable-card` as base class
* Prefer stacked layout on mobile, grid/flex on desktop

### 🔘 Buttons

* Use icons for quick scanning where possible

### ✍️ Forms

* Label always above input
* Vertical, single-column layout
* Allow “Save Draft” autosave or inline autosaving
* Keyboard-friendly on mobile
* Use `form-group`, `input-label`, `form-field` class structure

### 🚫 Modal Avoidance

* **Avoid modals**: Use `modal` only for critical actions (e.g., delete confirmation)
* Keep code clean. Do not combine list view and object view in the same component

---

## 🌓 Visual Style

### 🌚 Dark Mode by Default

* Soft contrast (avoid pure black or pure white)
* Use semantic colors (`surface-bg`, `text-muted`, `highlight`) for theme switching

### 📏 Spacing & Rhythm

* Use multiples of 4px
* Keep generous whitespace between logical sections
* Avoid overly dense UIs

### 🎨 Theme Readiness

* Use descriptive classes (`goal-card`, `task-heading`, `feedback-tag`)
* All colors, shadows, font sizes should be centralized in theme file
* Enable easy theme switching in future (e.g., dark, high-contrast, fantasy skin)
