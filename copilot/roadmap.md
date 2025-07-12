## 🛠️ Development Roadmap (MVP-first, Logical Dependencies)

### 🔰 Phase 1: Foundations (Weeks 1–2)

> Core entities, authentication, and user dashboard

- [x] **User Auth & Setup**
  - Email/password sign-up
  - Profile creation (class, backstory, goals)
  - Select character class and description

- [x] **Character Stats**
  - Create/view stats with descriptions, example activities, XP tracking
  - Manual level-up flow (with XP required formula)
  - XP log table for source tracking (used in future analytics)

- [x] **Stat Page**
  - View current level, XP progress, and XP history

- [x] **Family Management**
  - Add family members (name, relationship, likes/dislikes)
  - Track interactions (dates, task feedback)

- [x] **Daily Focus System**
  - Define custom focuses per day (e.g. "Call to Adventure")
  - Provide title + description
  - Editable schedule

- [x] **Simple Todos**
  - Create/view/complete simple one-off tasks
  - Display on homepage only

- [ ] **Homepage (Dashboard v1)**
  - Show today’s tasks (DM tasks, experiment tasks, simple todos)
  - Show completed tasks + XP gained
  - Quick journal entry launcher

---

### 🧠 Phase 2: GPT + Journal Integration (Weeks 3–4)

- [x] **Journal System**
  - Freeform conversational journal
  - Save entry after session

- [x] **GPT Journal Analysis**
  - Extract summary, synopsis, title
  - Assign content tags, tone tags, stat tags (and grant XP)
  - Store GPT log + metadata per entry

- [ ] **Stat XP Source Breakdown**
  - “What earned me XP in Strength this week?”

- [ ] **Family Interactions from Journal**
  - Extract out family interactions from journal

- [ ] **Goal interactions from journal**
  - Extract out goal interactions from journal
  
- [ ] Drop energy level from family
---

### 🗺️ Phase 3: Experiments & Tasks (Weeks 5–6)

- [ ] **Experiments**
  - Create/edit short-lived experiments
  - Daily task generation
  - Journal and XP dashboard for each experiment
  - Task completion tracking (per day)
  - Auto-regenerate next day's task

- [ ] **Ad-Hoc Tasks**
  - Manual log of repeatable activities tied to stats (e.g. “Workout”)
  - Grants XP to associated stat
  - Logged in a separate tab (not dashboard)

- [ ] **Dungeon Master GPT Task Generator**
  - Use character, goals, focus, family, weather, projects/adventures, past tasks
  - Generate 2 tasks per day (personal + family)

---

### 📚 Phase 4: Quests, Projects, & Adventure Tracking (Weeks 7–8)

- [ ] **Quests**
  - Long-term goal container
  - Can include summary, timeframe, and reflection
  - Dashboard includes: linked experiments, journal entries, XP stats

- [ ] **Projects & Adventures**
  - Unified model with `type` field
  - Add subtasks, mark completed
  - Not shown on dashboard, but available in GPT task context

---

### 🧼 Phase 5: UX Polish & Review Tools (Weeks 9–10)

- [ ] **Quest & Experiment Review Tools**
  - Graphs/charts of XP gained, tag breakdown, stats gained
  - Journal highlights by tag/tone
  - Export options (Markdown or PDF)

- [ ] **Visual Feedback & Delight**
  - Task completion XP animations
  - GPT-generated level title badges
  - Optional journal reflection recap
