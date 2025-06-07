---
applyTo: "**/*.{svelte,html,css}"
---

# Design Style Guide

## Core UX Principles

* **Responsive with purposeful animation**
  Prioritize immediate visual feedback. Use smooth transitions only when they enhance usability and user orientation — avoid decorative animations.

* **Professional tone**
  Use clear, direct language that builds confidence. Avoid overly casual or enthusiastic messaging. Messaging should be informative and supportive without being patronizing.

* **Structured clarity**
  Prioritize clarity over cleverness. Use layout, typography, and visual hierarchy to make interactions self-evident. Minimize cognitive load while maintaining visual interest.

* **Progressive disclosure**
  Interfaces should present information hierarchically. Show essential information first, with clear pathways to access additional detail when needed.

---

## Interaction Requirements

### Required Elements

* State updates (checkboxes, progress indicators, form submissions) must provide immediate feedback
* Dynamic content should integrate seamlessly without requiring page refreshes
* Submission states must be clearly communicated with appropriate status indicators
* Loading states should be informative and unobtrusive

### Design Constraints

* Animations should serve a functional purpose — indicating state changes, directing attention, or improving perceived performance
* Progress indicators should reflect actual progress or achievement rather than emotional encouragement
* Interactive elements should have clear affordances — if something looks clickable, it should be clickable

---

## Visual Design System

### Layout Structure

* **Grid-based design** using consistent spacing with `gap`, `space`, and `container` classes
* **Card-based components** with standardized styling:
  * Consistent border radius (`rounded-lg`)
  * Appropriate elevation (`shadow-md`)
  * Uniform padding (`p-4`, `p-6`)
* **Visual hierarchy** through left-border accents:
  * Semantic `border-l-4` to indicate content type, priority, or context
* **Responsive design** with breakpoint-aware layouts (`sm:flex`, `lg:grid-cols-*`)

### Interactive Feedback

* Utilize DaisyUI's built-in status classes (`alert-success`, `alert-warning`, `loading`, `toast`)
* Apply smooth transitions for state changes (`transition`, `hover:*`, `focus:*`)
* Implement clear confirmation messages and loading indicators where appropriate

### Color System

* **Semantic theming** using design tokens (`primary`, `secondary`, `accent`, `neutral`, `info`, `success`, `warning`, `error`)
* **Context-appropriate styling**:
  * Primary content: `border-l-4 border-primary`
  * Reflective content: `text-neutral`, `prose`
  * Data visualization: `progress`, `badge`, `indicator`

---

## Typography

* **Hierarchical text structure**:
  * Page titles: `text-2xl font-bold` or larger
  * Section headers: `text-xl font-semibold`
  * Body text: `text-sm text-base-content/secondary`
  * Supplementary text: `italic`, `text-opacity-70`
* **Content formatting** using DaisyUI prose classes (`prose`, `prose-sm`) for user-generated content
* **Consistent spacing** with appropriate margins (`mb-2`, `mt-4`) and content grouping (`space-y-*`)

---

## Component Patterns

* **Information Cards**:

  ```html
  <div class="card shadow-md border-l-4 border-accent">
    <div class="card-body">
      <h2 class="card-title">Health Metrics</h2>
      <p class="text-sm italic opacity-70">Progress tracking</p>
      <progress class="progress w-full" value="42" max="100"></progress>
    </div>
  </div>
  ```

* **Navigation Elements**:

  ```html
  <a href="/journal" class="block hover:bg-base-200 transition p-4 rounded-lg">
    <h3 class="font-semibold">Journal Entry</h3>
    <p class="text-sm opacity-70">Record your daily reflections</p>
  </a>
  ```

* **Status Indicators**:
  Use DaisyUI's `badge`, `badge-accent`, or `badge-neutral` for status communication and progress tracking.

---

## State Management

* **Optimistic updates** preferred: reflect user actions immediately
* Use `stores` or `signals` for syncing state across components
* Autosave whenever possible. Avoid "Save to apply" patterns unless necessary

---

## Implementation Checklist

* [ ] Consistent theming using DaisyUI color tokens and layout utilities
* [ ] Card-based design with contextual left-border indicators
* [ ] Responsive grids and consistent spacing
* [ ] Clear typography hierarchy and readable content structure
* [ ] Professional interaction patterns with appropriate feedback mechanisms
