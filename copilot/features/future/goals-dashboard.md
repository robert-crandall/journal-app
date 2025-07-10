### 📌 Issue: Goals Reflection & Dashboard

**Goal**: Create a dashboard and reflection system that shows how the user's daily actions (journal entries, tasks, quests, etc.) align with their long-term goals. This helps reinforce purpose, track progress over time, and guide GPT-generated suggestions.

---

### 🧩 Feature Requirements

- **Goal Overview Section**
  - Show all **active goals**, each with:
    - Title
    - Description
    - Tags or categories (if used)
    - Link to edit the goal
    - Button: “What have I done toward this lately?”

- **Reflection Summary per Goal**
  - Pull in and summarize:
    - Related quests, experiments, projects, or adventures
    - Related journal entries (matched by tags or explicit GPT connection)
    - Recent tasks that were aligned with the goal

  - GPT can generate a short paragraph:

    > _“You’ve made progress toward your goal of becoming more present by journaling 4 times this week, and completing 2 family-related tasks.”_

- **Progress Indicators**
  - Optional visualization of:
    - Number of actions tied to this goal in the last 7 / 30 days
    - Associated stat XP changes (e.g., “+90 XP in Fatherhood”)
    - Mood/tone trends (e.g., “Mostly calm and engaged” during goal-related entries)

- **Goal-Centric Filtering**
  - Let user filter their past data:
    - “Show me journal entries related to this goal”
    - “Show me completed tasks that supported this goal”

- **Quick Actions**
  - “Create new quest for this goal”
  - “Add project/adventure under this goal”
  - “Set as primary goal” (optional: influence GPT tone or emphasis)

---

### 🧠 GPT Integration Notes

- GPT should reference the user's **active goals**:
  - When summarizing journals
  - When generating tasks
  - When reviewing experiment/quest outcomes

- GPT can generate **alignment reports** like:

  > “This past week, your actions aligned best with your goal of emotional presence. Would you like to focus more on your goal of outdoor adventure next week?”

---

### 🎨 UI Ideas

- Each goal is a **collapsible card or tab**
- “Highlights” view shows alignment across all goals (e.g., heatmap or bar graph)
- Weekly GPT-generated summary:

  > _“How your week aligned with your goals”_

---

### ✅ Acceptance Criteria

- [ ] Dashboard shows active goals and their linked content
- [ ] GPT can summarize alignment between activity and each goal
- [ ] User can filter and view related tasks, entries, and stats
- [ ] Quick actions exist to expand on goals (create quest/project/etc.)
- [ ] Goal dashboard is accessible from profile or main nav
