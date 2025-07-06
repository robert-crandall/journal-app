### 📌 Issue: Goals System

**Goal**: Add a structured way for users to define and track **long-term personal goals** that influence GPT task generation, journaling context, and character identity.

---

### 🧩 Feature Requirements

- **Create/Edit Goals**
  - User can create a goal with:
    - **Title** (e.g., _“Live close to nature”_)
    - **Description** (why this matters to them)
    - (Optional) **Tags** (e.g., "family", "growth", "spirituality")

  - User can edit or archive goals
  - User can mark goal as active or inactive

- **Goal-to-Module Relationships**
  - Quests, Adventures, and Projects can optionally be **linked** to a goal
  - This allows grouping and reflection on _what goal a journey is serving_

- **GPT Context Usage**
  - Active goals are passed to GPT to influence:
    - Task generation (e.g., “This task helps you with your goal of being more adventurous”)
    - Journal interpretation (e.g., “Today’s reflection shows progress on your ‘engaged fatherhood’ goal”)
    - Summarization tone or emphasis

- **Goal Viewer**
  - A section in the Character Profile (or a standalone view) that shows:
    - Current goals
    - Associated quests/adventures/projects
    - Last time the goal was reflected in journal or tasks (optional)

---

### ✅ Acceptance Criteria

- [ ] User can create, edit, enable/disable, and archive goals
- [ ] Quests, projects, and adventures can link to a goal
- [ ] GPT can access active goals for task generation and journaling
- [ ] Character profile or dashboard view shows current goals and how they're being expressed
