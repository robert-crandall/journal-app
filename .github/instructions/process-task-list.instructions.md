---
description: Guidelines for managing task lists in markdown files to track progress on completing a PRD
applyTo: 'off/*'
---

# Task List Management

Guidelines for managing task lists in markdown files to track progress on completing a PRD

## Task Implementation

- **One feature at a time:** Do **NOT** start the next feature until you ask the user for permission and they say "yes" or "y"
- You can complete all sub-tasks under a feature without additional confirmation
- **Completion protocol:**
  1. When you finish a **sub‑task**, immediately mark it as completed by changing `[ ]` to `[x]`.
  2. If **all** subtasks underneath a parent feature are now `[x]`, follow this sequence:
  - **First**: Run the full test suite (`bun run test`, `bun run test:e2e`, etc.)
  - **Clean up**: Remove any temporary files and temporary code before committing
  - **Ask for permission**: Before starting the next feature, ask the user for permission.
  3. Once all the subtasks are marked completed and changes have been committed, mark the **parent task** as completed.
- Stop after each sub‑task and wait for the user's go‑ahead.

## Task List Maintenance

1. **Update the task list as you work:**
   - Mark features and subtasks as completed (`[x]`) per the protocol above.
   - Add new features as they emerge.

## AI Instructions

When working with task lists, the AI must:

1. Regularly update the task list file after finishing any significant work.
2. Follow the completion protocol:
   - Mark each finished **sub‑task** `[x]`.
   - Mark the **parent feature** `[x]` once **all** its subtasks are `[x]`.
3. Add newly discovered features.
4. Before starting work, check which sub‑task is next.
5. After implementing a sub‑task, update the file.
6. Pause for approval before starting a new feature.
