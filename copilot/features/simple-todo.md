### ✅ Feature: Simple Todos

**Description:**
Allow users to create, view, and complete simple, one-off todo items. These are not tied to quests, experiments, or GPT context — they’re purely personal reminders. Simple todos are shown **only on the homepage** as a lightweight productivity aid.

---

**Acceptance Criteria:**

- [ ] User can create a new simple todo with a short description
- [ ] User can view a list of current simple todos on the homepage
- [ ] User can mark a todo as complete
- [ ] Completed todos are removed from the list (or optionally archived for now)
- [ ] Todos are stored per-user

---

**Design Notes:**

- Keep the interface minimal and frictionless
- These items do **not** contribute XP
- These todos should **not** appear in GPT task generation context
