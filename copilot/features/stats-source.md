### 📊 Feature: Stat XP Source Breakdown

**Description:**
Users should be able to see **where their XP is coming from** for each character stat. For example, answering the question: _“What earned me XP in Strength this week?”_ This helps users understand what actions contribute most to their personal growth and aligns with the RPG-style progression system.

---

**Acceptance Criteria:**

- [ ] User can select a stat (e.g. Strength) and time window (e.g. last 7 days)
- [ ] System returns a breakdown of all XP events that contributed to that stat
- [ ] Each XP event includes:
  - Source (e.g. Journal, Quest Task, Ad-Hoc Task)
  - Associated entry or task (with title or summary)
  - XP amount
  - Date earned

- [ ] Results are grouped by source and sorted by date
- [ ] Total XP for selected period is displayed

---

**Design Notes:**

- Pulls from XP log or stat history table (should already exist for traceability)
- Show inline links to related journal entries or tasks if possible
- Group by source type (e.g., “Journal Entries”, “Ad-Hoc Tasks”, “Experiments”)

---

**Stretch Goals (Optional):**

- Include charts (bar, timeline) for visual trend of XP earned
- Add filtering by project, experiment, or quest (if associated)

---

**Related Features:**

- \#xx Character Stats & XP System
- \#xx Journal GPT Analysis (for XP from stat tags)
- \#xx Task Completion & XP Logging

Let me know if you want the query logic or data schema suggestions bundled into a dev task.
