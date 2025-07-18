## Features

- [x] 1.0 User Authentication & Onboarding
  - [x] 1.1 Design and implement user registration, login, and logout (backend)
  - [x] 1.2 Write backend integration tests for authentication
  - [x] 1.3 Implement frontend authentication UI (register, login, logout)
  - [x] 1.4 Write frontend E2E tests for authentication flows
  - [x] 1.5 Ensure all authentication tests pass

- [x] 2.0 Character Creation & Customization
  - [x] 2.1 Design and implement character creation (class selection, custom class, backstory) (backend)
  - [x] 2.2 Write backend integration tests for character creation
  - [x] 2.3 Implement frontend character creation UI
  - [x] 2.4 Write frontend E2E tests for character creation
  - [x] 2.5 Ensure all character creation tests pass
  - [x] 2.6 Add a motto to the character
  - [x] 2.7 Left align goals on character view
  - [x] 2.8 Character edit screen, forms run into label and description
  - [x] 2.10 On mobile, the screen is just a little too wide
  - [x] 2.11 Character screen should be responsive, not mobile only

- [ ] 3.0 Stats System (Predefined & Custom Stats, XP, Leveling)
  - [x] 3.1 Design and implement stats system (predefined/custom stats, XP, level calculation) (backend)
  - [x] 3.2 Write backend integration tests for stats system
  - [ ] 3.3 Implement frontend stats management UI
  - [ ] 3.4 Write frontend E2E tests for stats system
  - [ ] 3.5 Ensure all stats system tests pass

- [ ] 4.0 Goals & Family Context Management
  - [x] 4.1 Design and implement goals and family members management (backend)
  - [x] 4.2 Write backend integration tests for goals/family
  - [ ] 4.3 Implement frontend UI for goals and family members
  - [ ] 4.4 Write frontend E2E tests for goals/family
  - [ ] 4.5 Ensure all goals/family tests pass

- [ ] 5.0 Simple Todos (One-off Tasks)
  - [x] 5.1 Design and implement simple todo CRUD (backend)
  - [x] 5.2 Write backend integration tests for todos
  - [x] 5.3 Implement frontend UI for simple todos
  - [ ] 5.4 Write frontend E2E tests for todos
  - [ ] 5.5 Ensure all todo tests pass

- [ ] 6.0 XP & Leveling System (Task Completion, Manual Level Up)
  - [x] 6.1 Implement XP grant on task completion (backend)
  - [x] 6.2 Implement manual level up logic (backend)
  - [x] 6.3 Write backend integration tests for XP/leveling
  - [ ] 6.4 Implement frontend XP/level up UI
  - [ ] 6.5 Write frontend E2E tests for XP/leveling
  - [ ] 6.6 Ensure all XP/leveling tests pass

- [ ] 7.0 Conversational Journal (Entry, Questions, Saving)
  - [x] 7.1 Design and implement journal entry system (backend)
  - [x] 7.2 Write backend integration tests for journaling
  - [ ] 7.3 Implement frontend conversational journal UI
  - [ ] 7.4 Write frontend E2E tests for journaling
  - [ ] 7.5 Ensure all journal tests pass

- [ ] 8.0 AI Dungeon Master Integration (Level Titles, Daily Task Generation, Journal Analysis)
  - [ ] 8.1 Integrate GPT for level title generation (backend)
  - [ ] 8.2 Integrate GPT for daily task generation (backend)
  - [ ] 8.3 Integrate GPT for journal analysis (backend)
  - [ ] 8.4 Write backend integration tests for AI features
  - [ ] 8.5 Implement frontend UI for AI-generated content
  - [ ] 8.6 Write frontend E2E tests for AI features
  - [ ] 8.7 Ensure all AI feature tests pass

- [x] 9.0 Quests & Experiments (Creation, Tasks, Conclusions)
  - [x] 9.1 Design and implement quests and experiments (backend)
  - [x] 9.2 Write backend integration tests for quests/experiments
  - [ ] 9.3 Implement frontend UI for quests/experiments
  - [ ] 9.4 Write frontend E2E tests for quests/experiments
  - [ ] 9.5 Ensure all quests/experiments tests pass

- [x] 10.0 Projects & Ad-Hoc Tasks
  - [x] 10.1 Design and implement projects and ad-hoc tasks (backend)
  - [x] 10.2 Write backend integration tests for projects/ad-hoc tasks
  - [x] 10.3 Implement frontend UI for projects/ad-hoc tasks
  - [ ] 10.4 Write frontend E2E tests for projects/ad-hoc tasks
  - [ ] 10.5 Ensure all projects/ad-hoc tasks tests pass

- [ ] 11.0 Weather API Integration
  - [ ] 11.1 Integrate real weather API for task generation (backend)
  - [ ] 11.2 Write backend integration tests for weather API
  - [ ] 11.3 Ensure all weather API tests pass

- [ ] 12.0 Main Dashboard (Tasks, XP Animation, Quick Journal)
  - [ ] 12.1 Design and implement main dashboard UI (frontend)
  - [ ] 12.2 Implement XP animation and quick journal entry
  - [ ] 12.3 Write frontend E2E tests for dashboard
  - [ ] 12.4 Ensure all dashboard tests pass

- [ ] 13.0 Quest & Experiment Dashboards
  - [ ] 13.1 Design and implement quest/experiment dashboard UI (frontend)
  - [ ] 13.2 Show progress, tasks, journal entries, XP, conclusions
  - [ ] 13.3 Write frontend E2E tests for quest/experiment dashboards
  - [ ] 13.4 Ensure all quest/experiment dashboard tests pass

- [x] 14.0 Plans System (Multi-type Task Management)
  - [x] 14.1 Design and implement plans system (projects, adventures, themes) (backend)
  - [x] 14.2 Write backend integration tests for plans system
  - [x] 14.3 Implement frontend UI for plans management
  - [x] 14.4 Rename from "projects" to "plans" throughout frontend
  - [x] 14.5 Add Plans menu item to navigation
  - [x] 14.6 Ensure all plans functionality works correctly

---

**Relevant files:**

- `/copilot/prd-gamified-life-app.md`
- `/copilot/requirements.md`
- `/copilot/tasks-prd-gamified-life-app.md`

**Notes:**

- Each feature must include backend integration tests and frontend E2E tests before being considered complete.
- Type safety: Frontend must import all types directly from backend.
- Data relationships: Use loose lookups, avoid cascading deletes.
- UI/UX: Optimize for INTJ + ADHD personas (clarity, feedback, minimal distraction).
- Out of scope: Third-party task sync, negative XP, monetization, social features.
- **XP System:** Abstracted character_stat_xp_grants to generic xp_grants table supporting multiple entity types (character_stat, family_member, goal, project, adventure).
