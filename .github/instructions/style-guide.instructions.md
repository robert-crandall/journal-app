---
applyTo: "**/*.{svelte,html,css}"
---

## 🧭 Preferred Design Style Guide

### 🎯 Core UX Principles

* **Responsive with subtle animation**
  Prioritize immediate visual feedback. Use smooth transitions only when they reinforce orientation or flow — never for novelty.

* **Emotionally grounded tone**
  Avoid exaggerated, cheerleader-style language. Aim for sincere, affirming prompts that build trust and reflection.

* **Structured clarity**
  Favor clarity over cleverness. Use layout, typography, and grouping to make interactions self-evident. Clutter is avoided, but warmth is welcome.

* **Scaffolded depth**
  Interfaces should scale in complexity without becoming overwhelming. Show essential information first, with the option to dive deeper.

---

## ⚙️ Interaction Rules

### ✅ Must-Haves

* State updates (e.g., checkboxes, progress bars) must be instant
* GPT or backend-generated content should integrate seamlessly without requiring reload
* Submission states should be clear: success/failure indicators with optional micro-animation or copy like “Saved ✓”

### ⚠️ Cautious Use

* Animations should reinforce interaction or state change, not delight
* Progress affirmation should reflect effort (“+100 XP in Strength”), not emotion (“You crushed it!”)
* Make large UI blocks clickable where it makes sense (e.g. a stat card, a todo item)

---

## 🎨 Visual Design System

### 🧱 Layout

* **Grid-based structure** with `gap`, `space`, and `container` classes
* Use **card-based UI blocks**:

  * Rounded corners (`rounded-lg`)
  * Subtle elevation (`shadow-md`)
  * Padding (`p-4`, `p-6`)
* Use **left-side visual anchors**:

  * Semantic `border-l-4` to represent context (e.g., stat type, emotion, urgency)
* Use responsive stacking with `sm:flex`, `lg:grid-cols-*`, etc.

### 🪄 Feedback + Animation

* Use DaisyUI’s status classes (`alert-success`, `alert-warning`, `loading`, `toast`) when possible
* Add transitions to hover/focus states (`transition`, `hover:*`, `focus:*`)
* Optional animated “Saved ✓” messages or loading indicators are encouraged when meaningful

### 🧭 Theming

* Use **semantic color tokens** (`primary`, `secondary`, `accent`, `neutral`, `info`, `success`, `warning`, `error`) instead of hardcoded color classes
* Match section tone to intent:

  * Primary section → `border-l-4 border-primary`
  * Reflective section → `text-neutral`, `prose`
  * Stats/progress → `progress`, `badge`, `indicator`

---

## 🔡 Typography

* **Hierarchical and legible**:

  * Titles: `text-2xl font-bold` or larger
  * Section headers: `text-xl font-semibold`
  * Body: `text-sm text-base-content/secondary`
  * Quotes/affirmations: `italic`, `text-opacity-70`
* **Use DaisyUI prose classes** (`prose`, `prose-sm`) for user-generated or rich text
* Support readability with spacing (`mb-2`, `mt-4`) and chunking (`space-y-*`)

---

## 🧩 Components and Patterns

* **Stat Cards**:

  ```html
  <div class="card shadow-md border-l-4 border-accent">
    <div class="card-body">
      <h2 class="card-title">Physical Health</h2>
      <p class="text-sm italic opacity-70">"Level 1 - Keep pushing forward!"</p>
      <progress class="progress w-full" value="42" max="100"></progress>
    </div>
  </div>
  ```

* **Interactive Blocks**:

  ```html
  <a href="/journal" class="block hover:bg-base-200 transition p-4 rounded-lg">
    <h3 class="font-semibold">Write Your Journal</h3>
    <p class="text-sm opacity-70">Reflect on your day in a few sentences.</p>
  </a>
  ```

* **Badges & Levels**:
  Use DaisyUI’s `badge`, `badge-accent`, or `badge-neutral` to communicate status, XP, or levels.

---

## 🔁 State Management & Sync

* **Optimistic updates** preferred: reflect user actions immediately
* Use `stores` or `signals` for syncing state across components
* Autosave whenever possible. Avoid "Save to apply" patterns unless necessary

---

## ✅ Summary for Reuse

* [x] Semantically themed UI using DaisyUI color tokens and layout utilities
* [x] Structured, card-based design with left-border tone indicators
* [x] Responsive grids and spacing for clarity
* [x] Typography with readable hierarchy and gentle variation
* [x] Interaction rules grounded in emotional neutrality and feedback clarity
