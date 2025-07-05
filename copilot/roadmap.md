# Gamified Life App Roadmap


## 📦 Features Checklist

- [x] **User Authentication**
	- Description: Users can register, log in, and log out securely.
	- Depends on: None

- [x] **Character Creation**
	- Description: Users create a character with a class (predefined or custom) and a backstory.
	- Depends on: User Authentication

- [x] **Stats System**
	- Description: Users define and track personal stats (e.g., Strength, Wisdom, Fatherhood), each with XP and levels.
	- Depends on: Character Creation

- [ ] **Goals Management**
	- Description: Users set high-level goals for personal growth and context.
	- Depends on: User Authentication

- [ ] **Family Management**
	- Description: Users add family members with names and descriptions for context.
	- Depends on: User Authentication

- [ ] **Simple Todos**
	- Description: Users can create, view, and complete simple, one-off todo items.
	- Depends on: User Authentication

- [ ] **XP & Leveling System**
	- Description: Completing tasks grants XP to stats; users can manually level up stats when enough XP is earned.
	- Depends on: Stats System, Simple Todos

- [ ] **Basic Journaling**
	- Description: Users can launch a conversational journal with predefined questions and save entries.
	- Depends on: User Authentication

- [ ] **AI-Powered Level Titles**
	- Description: GPT generates creative, humorous titles for each stat level.
	- Depends on: Stats System

- [ ] **AI Daily Task Generation**
	- Description: GPT generates two daily tasks (personal and family) using user context and weather data.
	- Depends on: Character Creation, Goals Management, Family Management, Stats System, Weather API

- [ ] **AI Journal Analysis**
	- Description: GPT processes journal entries to extract summaries, synopses, titles, content tags, and stat tags; XP is granted to relevant stats.
	- Depends on: Basic Journaling, Stats System

- [ ] **Quests**
	- Description: Users create long-term quests with multiple tasks; context is provided to AI for task generation.
	- Depends on: AI Daily Task Generation

- [ ] **Experiments**
	- Description: Users create short-term experiments with tasks and conclusions; can be linked to quests.
	- Depends on: Quests

- [ ] **Projects**
	- Description: Users define projects with tasks (no XP); used as context for AI DM.
	- Depends on: AI Daily Task Generation

- [ ] **Adventures**
	- Description: Users define adventures with tasks (no XP); used as context for AI DM.
	- Depends on: AI Daily Task Generation

- [ ] **Ad-Hoc Tasks**
	- Description: Users create repeatable, stat-tied tasks (e.g., "Workout" for Strength) to log daily activities.
	- Depends on: Stats System

- [ ] **Weather API Integration**
	- Description: Integrate a real weather API to provide context for daily task generation.
	- Depends on: AI Daily Task Generation

- [ ] **Main Dashboard**
	- Description: Dashboard displays today's actionable tasks, XP animations, running XP total, and quick journal entry access.
	- Depends on: All task and journaling features

- [ ] **Quest & Experiment Dashboards**
	- Description: Dedicated pages for each quest/experiment showing progress, tasks, journal entries, and XP gained.
	- Depends on: Quests, Experiments, Basic Journaling, XP & Leveling


## 🧩 Suggested Build Phases

_Phase 1: User Authentication, Character Creation, Stats System, Goals & Family Management_

_Phase 2: Simple Todos, XP & Leveling System, Basic Journaling_

_Phase 3: AI-Powered Level Titles, AI Daily Task Generation, AI Journal Analysis, Weather API Integration_

_Phase 4: Quests, Experiments, Projects, Adventures, Ad-Hoc Tasks_

_Phase 5: Main Dashboard, Quest & Experiment Dashboards_
