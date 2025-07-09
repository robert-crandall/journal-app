## 🚧 Development Roadmap

### 🧱 Phase 1: Foundation

**Goal:** Set up infrastructure, core entities, and enable basic user workflows.

* [x] **User Authentication**

  * Email + password auth
  * Basic user profile (name, time zone)

* [ ] **Core Models**

  * `User`
  * `Task` (can be ad-hoc, or linked to source like quest/project)
  * `Quest` (with `type` field: `quest` or `experiment`)
  * `Project` (with `type` field: `project` or `adventure`)
  * `Stat` (with XP tracking, descriptions, and level logic)
  * `JournalEntry`

* [ ] **Journal System MVP**

  * Freeform journal entry
  * Journal is linked to the user and date
  * View past entries

---

### 🧠 Phase 2: GPT Integration

**Goal:** Make journaling smart and insightful.

* [ ] **Conversational Journal Interface**

  * GPT-assisted reflection (chat interface)
  * Store full conversation

* [ ] **Journal Analysis**

  * GPT extracts:

    * Summary
    * Synopsis
    * Title
    * Content tags
    * Stat tags (+ XP)
  * Display results in entry view

* [ ] **Stat Leveling Logic**

  * XP formula:
    * Total XP required for level: `TotalXP = ((Level * (Level -1))/2) * 100`
    * Incremental XP required for level upgrade: `IncrementalXP = Level * 100`
  * Manual level-up (reward moment)

---

### 🧭 Phase 3: Task Management (Weeks 5–6)

**Goal:** Enable task tracking and stat progression.

* [ ] **Task Views**

  * Daily view: tasks due today
  * Completion feedback → XP gain

* [ ] **Task Sources**

  * Quests/Experiments (repeat daily tasks)
  * Projects/Adventures (non-XP subtasks)
  * Ad-hoc tasks (XP-tied, like “Workout”)
  * Simple todos (no XP)

* [ ] **Stat Dashboard**

  * Show current XP and level
  * Breakdown: recent tasks that gained XP

---

### 🧙 Phase 4: Life-as-RPG Intelligence (Weeks 7–8)

**Goal:** GPT starts acting like your Dungeon Master.

* [ ] **Character System**

  * Class, backstory, and goals
  * Focuses (by day of week)
  * Family members (names, interests)

* [ ] **GPT Task Generation**

  * Uses all context to assign:

    * Personal task
    * Family-oriented task
  * GPT can access:

    * Projects, weather, last family task

---

### 📊 Phase 5: Insights & Retrospectives (Weeks 9–10)

**Goal:** Learn from your data. What’s working?

* [ ] **Quest/Experiment Pages**

  * Task completion rate
  * Stat XP gained
  * Journal entries during timeframe

* [ ] **Reflection Tools**

  * "What helped my strength most this month?"
  * "Which experiments improved my mood?"
