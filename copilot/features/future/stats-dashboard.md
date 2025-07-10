### 📌 Issue: Stat Insights & Progress Dashboard

**Goal**: Create a dashboard that visualizes how the user is progressing across their character stats (e.g., Strength, Fatherhood, Wisdom), including XP sources, level history, and trends over time.

This helps the user see how their real-world actions are shaping their identity — like watching a character sheet evolve in an RPG.

---

### 🧩 Feature Requirements

- **Stat Overview Grid or Table**
  - Show all current stats with:
    - Stat name
    - Current level (e.g., _Strength Level 3_)
    - XP bar: `420 / 600 XP`
    - XP needed to level up
    - Manual “Level Up” button (if threshold reached)
    - GPT-generated **level title** (e.g., “Stone Lifter”)

- **XP History Per Stat**
  - Show how XP was earned:
    - Tasks (with task name and date)
    - Journal entries (with short quote or GPT-generated tag summary)
    - Quests or experiments

  - Answer questions like:

    > “What gave me the most Fatherhood XP this week?”

- **Level Timeline View**
  - Visual display of level ups over time
  - Optional: GPT can generate “milestone recaps”:

    > “You hit Level 3 in Wisdom last week — thanks to your reflection streak and reading quest!”

- **Stat Filtering**
  - Filter by stat to see:
    - Related tasks and journal entries
    - Associated quests/experiments
    - Time periods (7/30/90 days)

- **Trend Analysis (Optional GPT)**
  - GPT can analyze stat XP patterns:

    > “You’ve been steadily growing Strength but haven’t added to Creativity lately — want help balancing that?”

---

### 🧠 GPT Integration Notes

- GPT should be able to:
  - Generate **level-up titles** per stat
  - Summarize **why a stat grew recently**
  - Identify **neglected stats** and offer ideas to engage them
  - Create milestone messages (optional)

---

### 🎨 UI Ideas

- Cards or list view of stats
- Color-coded XP progress
- “Level Up” celebratory animations
- History tab per stat
- GPT insight section (optional)

---

### ✅ Acceptance Criteria

- [ ] Dashboard shows all stats with XP, level, and title
- [ ] User can view XP history per stat with source breakdown
- [ ] Level up is manual, with visual feedback
- [ ] (Optional) GPT can generate stat growth summaries and insights
- [ ] Related tasks, quests, and journals are linked per stat
