### 📌 Issue: Quests (Long-Term Personal Challenges)

**Goal**: Enable users to create, track, and complete quests — structured, multi-day challenges designed to reinforce personal growth and RPG-style character development. Quests assign tasks, grant XP, and help reinforce long-term habits.

---

### 🧩 Feature Requirements

#### 1. **Create Quest**

* User defines:

  * **Title** (e.g., "Reconnect with Nature")
  * **Description** (freeform)
  * **Start Date** and **End Date**
  * **Tasks** (e.g., “Complete 7 hikes” or “Practice piano 10 times”)

    * Each task has a title, optional due date, and repeat settings
  * **Target stat(s)** (e.g., Strength, Creativity, Fatherhood)

    * Tasks can optionally grant XP to one or more stats

#### 2. **Track Progress**

* Quests are visible on the **homepage dashboard** if active
* For each quest:

  * Show number of completed tasks vs total
  * Progress bar for time remaining and completion %
  * XP earned from tasks so far
  * Show task list with checkboxes

#### 3. **Complete Tasks**

* Marking a task as complete:

  * Grants optional XP to associated stat(s)
  * Saves a timestamp

#### 4. **Completion Logic**

* Quests can be:

  * **Active** (now until end date)
  * **Expired** (end date passed, not fully complete)
  * **Completed** (all tasks finished)
* If all tasks are completed before the deadline:

  * Bonus XP is awarded to the primary stat(s)
  * GPT may generate a congratulatory journal summary (optional future)

#### 5. **Delete / Archive Quests**

* Deleting a quest **does not delete** tasks or journal entries associated with it
* Quests can be archived after completion

---

### ✅ Acceptance Criteria

* [ ] User can create a quest with multiple tasks
* [ ] Quests are shown on the homepage while active
* [ ] Task completion is tracked with XP gains
* [ ] Quests display progress, time remaining, and XP earned
* [ ] Quests can be completed, expired, or archived
* [ ] Deleting a quest does not remove completed tasks or journal entries
