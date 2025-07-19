## ✅ GitHub Issue: Implement Plans & Subtasks

```
### ✨ Feature: Plans with Subtasks

This feature adds a flexible container model called **Plans**, used for organizing Projects, Adventures, Themes, or other structured sets of work.

---

### ✅ What to Build

#### 1. `plans` table
- `id`: uuid
- `title`: string
- `type`: 'project' | 'adventure' | 'theme' | 'other'
- `description`: optional long-form text
- `focusId`: foreign key to focus table (used by GPT when matching a focus day).
- `isOrdered`: boolean (determines if subtasks are done sequentially)
- `lastActivityAt`: last time a task was completed
- `createdAt`, `createdBy`

#### 2. `plan_subtasks` table
- `id`: uuid
- `planId`: foreign key to `plans`
- `title`: short description
- `description`: optional markdown body
- `isCompleted`: boolean
- `orderIndex`: number (nullable if unordered)
- `createdAt`, `createdBy`

---

### 🧠 Why It Matters

- Enables **Projects** like “Build the Shed” with ordered steps.
- Enables **Adventures** like “Climb Mt Taylor” with unordered objectives.
- Enables themed task containers like “Cleaning Tasks” for focus days.
- Supports **GPT task generation** by aligning `focus` to current plan context.

---

### 💡 UI Notes (future)
- Plans can be listed and filtered by type
- Subtasks should be editable inline
- Support reordering via drag-and-drop if `isOrdered` is true
- Support markdown rendering in subtask descriptions
```
