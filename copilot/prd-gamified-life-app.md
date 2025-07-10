# 🧠 Life RPG App Requirements

## 🎯 Goal
Create an app that helps me become a better version of myself by turning life into a Dungeons & Dragons-style game. The app helps me focus on what matters most — adventure, family, purpose — using GPT to act as a Dungeon Master (DM) and guide tasks, reflection, and growth.

---

## 🧙 Character System

### Class & Backstory
- Each user selects a **class** (e.g. "Ranger") and writes a short **backstory**
- This informs GPT task generation

### Stats
- Stats represent personal growth areas (e.g. `Strength`, `Fatherhood`)
- Each stat has:
  - **Description** (e.g. “The ability to lift heavy things”)
  - **Example activities** (to guide GPT and self-reflection)
  - **XP tracking** (granted by tasks or journal entries)
  - **Levels**:
    - XP is cumulative
    - Formula: XP required for level _n_ = `(n * 100)`
    - Level-ups are done manually for a reward moment
    - Optional: GPT-generated level titles (e.g. “Weak Worm” → “Barbarian”)

---

## 📅 Daily Task Sources

### Dungeon Master (GPT)
- GPT generates 2 daily tasks:
  - 1 personal (based on class, focus, goals, weather, etc.)
  - 1 family (draws from family profiles and past feedback)
- Uses:
  - Active **Quests**
  - Character info
  - Weather API
  - Projects/Adventures
  - Focus of the day
  - Last family activity

### Quests (🧭)
- **Purpose**: High-level themes that guide a season of life (e.g. “Reconnect with Nature”)
- **Duration**: Typically quarterly
- **Influences GPT**: Yes
- **Daily Tasks**: ❌ No
- **Used For**:
  - Reflection and life tracking
  - Reviewing past years
- **Dashboard Shows**:
  - All journal entries during quest
  - Related experiments
  - XP earned by stat
  - Manual summary or notes

### Experiments (🧪)
- **Purpose**: Test lifestyle changes (e.g. “No sugar for 7 days”)
- **Duration**: Days or weeks
- **Influences GPT**: ❌ No
- **Daily Tasks**: ✅ Yes (repeatable)
- **Used For**:
  - Measuring outcomes (“What made life better?”)
- **Dashboard Shows**:
  - Journal entries
  - Task completion rates
  - XP gained by stat
  - Final summary/reflection

### Projects / Adventures (🛠️🏕️)
- **Purpose**: Track ongoing initiatives (e.g. “Build a shed” or “Plan a family camping trip”)
- **Identical Data Model**, differentiated by `type: 'project' | 'adventure'`
- **Subtasks**:
  - Created manually
  - Not shown on dashboard
  - Not XP generating
  - Included in GPT context to suggest productive alternatives

### Ad-Hoc Tasks
- Tied to a stat (e.g. “Workout” → Strength)
- Manual logging = immediate XP
- Not shown on main dashboard
- Used for daily habit logging

### Simple Todos
- One-off reminders, not tracked or analyzed
- Shown on dashboard
- Not included in GPT context
- No XP

---

## 📓 Journal System

### Freeform Journal
- GPT-assisted conversation with a life coach tone
- Open-ended input
- Optional follow-up prompts

### After Entry Submission
GPT analyzes the conversation and extracts:
- **Summary**: Rewritten narrative based on tone
- **Synopsis**: 1–2 sentence overview
- **Title**: 6–10 word descriptive title
- **Content Tags**: e.g. `sleep`, `stress`, `family`
- **Tone Tags**: e.g. `calm`, `overwhelmed`, `joyful`
- **Stat Tags**: match to existing stats and grant XP

---

## 👥 Family

- User defines family members
  - Name
  - Relationship
  - Likes / dislikes
- GPT uses this to generate bonding tasks
- System tracks:
  - When a task was last done with each member
  - Feedback from tasks (e.g. “They didn’t like this”)

---

## 🧠 GPT Integration

- GPT used in:
  - Daily task assignment
  - Journal conversation
  - Journal analysis
  - Stat tagging + XP assignment
  - Quest summaries (optional)
- GPT uses context:
  - Class & backstory
  - Active quests
  - Focus of the day
  - Projects/adventures
  - Weather
  - Family info
  - Past task feedback

---

## 🧑‍💻 Technical Notes

- App designed for INTJ with ADHD:
  - Minimal friction
  - Visible progress
  - Thoughtful layout
- All entities support full CRUD
- Loose coupling: deleting quests/experiments doesn't remove tasks or journal entries
- Stack recommendation: **Next.js + tRPC + Drizzle ORM + PostgreSQL + Tailwind CSS**

---

## 📺 Screens & UX

### Homepage / Dashboard
- Tasks for today (from experiments, DM, simple todos)
- Quick journal entry launcher
- Completed tasks + XP gain animations

### Quests & Experiments Dashboards
- Timeline of journal entries
- XP breakdown
- Related stats and tags
- Completion analytics

### Stat Page
- Current XP and level
- Manual level-up flow
- Recent sources of XP for that stat
