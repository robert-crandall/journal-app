### 🧪 Feature: Experiments

**Description:**
Experiments are short-lived self-improvement tests, like “Go without social media for 7 days.” Each experiment automatically generates **daily tasks** and includes a **dashboard** to reflect on journal entries and XP gained during the experiment. These help answer the question: _“What made my life better?”_

---

**Acceptance Criteria:**

- [ ] User can **create** and **edit** an experiment
  - Fields: Title, Description, Start Date, End Date

- [x] User can define **multiple daily tasks** that will show on the user's homepage.
- [x] Each task can have success metric. For example, a task of "workout 3 times a week" would have a metric of 3 tasks (workouts) done in a 7 day experiment.
- [x] Task can be **marked complete** once per day
- [x] Tasks that are not marked completed do not need a database record.
- [x] Tasks that are completed are recorded, so the total number of completed tasks can be shown on the experiment dashboard.
- [ ] Tasks can be marked completed for previous days. This allows a user to correct missing completions.
- [ ] Total number of completed tasks can be shown on the experiment dashboard.
- [ ] Each experiment has a **dashboard** showing:
  - Number of days completed
  - Total XP earned (from tasks and journals during experiment timeframe)
  - Related journal entries (filtered by date range)
  - Stat XP breakdown during the experiment

---

**Design Notes:**

- Tasks generated from experiments should not influence GPT context
- Deleting an experiment does **not** delete associated journal entries
- Use a reusable dashboard layout (shared with Quests if possible)
- XP may be awarded per task (if configured) and/or via journal analysis during the experiment
- Task completion should log date and optionally any notes

---

**Stretch Goals:**

- Graph showing task completion over time
- Optional prompt at end of experiment: _“Did this experiment improve your life?”_ or "Should you repeat this experiment?"
