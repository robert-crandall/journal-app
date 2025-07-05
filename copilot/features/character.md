### 📌 Issue: Character Creation Feature

**Goal**: Enable users to define their in-game persona ("character") by selecting a class, writing a backstory, and setting a motto. This forms the narrative and contextual foundation for GPT task generation and journaling.

---

### 🧩 Feature Requirements

- **Character Class**
  - Users inputs a class name (ie, "Fighter" or "Monk").

- **Backstory**
  - Freeform text input (e.g., “I’m a software developer trying to reconnect with nature and be present with my family”).
  - Stored as part of the user profile.
  - Will be given to GPT during task generation and journaling.

- **Personal Motto**
  - Freeform text field (e.g., “Be an outdoor adventurer and an engaged dad”).
  - Also stored and included in GPT prompt context.

- **Editable Profile Screen**
  - Create or update class, backstory, and motto.
  - Display current level, XP summary, and a preview of stat progression (if already started).

---

### 🧠 GPT Integration Notes

- The class, backstory, and motto will be included in every GPT prompt for:
  - Journal mode (e.g., “I want to reflect like a Ranger”)
  - Task generation (e.g., “What would a Ranger focused on family do on a rainy day?”)

---

### 📦 Data Model

```ts
// Example additions to user table or profile extension
class: string
backstory: string
motto: string
```

---

### ✅ Acceptance Criteria

- [ ] User can input their class title
- [ ] User can enter/edit their backstory and goal
- [ ] Data is saved and can be retrieved per user
- [ ] Stored values are accessible by GPT prompt handler
- [ ] Character info is visible in a profile or summary panel
- [ ] E2E tests are created. All existing tests pass.
