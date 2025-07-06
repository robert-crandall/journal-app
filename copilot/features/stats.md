## 🎯 What Are Stats?

**Stats** represent personal traits the user wants to grow — physical, mental, relational, or aspirational. Think of them like RPG attributes, but personalized.

Each stat tracks:

- XP earned through tasks or journaling
- Example activities that help GPT (and the user) understand what counts
- Current **level**, which reflects progress
- An optional, GPT-generated **title** that makes leveling up fun (e.g., _"Strength Level 3: Tree Hauler"_).

---

## 📥 Stat Input Screen

Here’s what the **"Create or Edit Stat"** screen should include:

### 1. **Name**

- Text input (e.g., `Strength`, `Fatherhood`, `Self-Control`)

### 2. **Description**

- Freeform field: What this stat means to the user
  _"The ability to lift heavy things."_
  _"The ability to be present and patient with my kids."_

### 3. **Example Activities**

- A list of examples (used as GPT context)
- Each activity should include:
  - A short description: _“Deadlift session at gym”_
  - Suggested XP (e.g., `+20`)

- User can add, edit, or delete examples
  _(This helps GPT award XP fairly and consistently.)_

### 4. **Level & XP**

- Auto-calculated level based on XP
- Formula:
  **Total XP for level _n_ = 100 × (n × (n + 1)) / 2**
  - Level 1 → 100 XP
  - Level 2 → 300 XP total
  - Level 3 → 600 XP total
  - etc.

- Display:
  - Current XP (e.g., `260 XP`)
  - XP needed to level up (`Next Level: 300 XP`)
  - Manual “Level Up” button (with optional reward prompt or celebration)

### 5. **Level Title (Optional)**

- GPT-generated humorous or inspiring nickname per level
  - e.g., “Strength Level 1: Noodle Arms”, “Level 5: Boulder Lifter”

- Stored alongside each level, visible in the UI

---

## 🔍 XP Tracking & Lookup

Each time XP is granted, it should be **tied to a source** for later review.

### XP Grants should store:

- **Stat ID**
- **Amount of XP**
- **Source Type**: `"task"`, `"journal"`, `"adhoc"`, `"quest"`, etc.
- **Source ID**: (optional; e.g., journal entry ID or task ID)
- **Timestamp**
- **Optional comment or GPT-generated reason** (e.g., _“You completed a 45-min hike”_)

This enables:

- A “Stat History” view:

  > **“What earned me 120 XP in Strength this week?”**
  > → _“Task: 30 pushups (+15 XP), Journal Entry: hike reflection (+25 XP), Quest: 2-mile ruck (+80 XP)”_

---

## 🧠 GPT Integration

When generating tasks or analyzing journal entries:

- GPT is given the full list of stats, each with:
  - Name
  - Description
  - Example activities

- GPT is also given recently granted XP as memory/context:
  - _“Last week, you gained +100 XP in Strength from 3 workouts.”_

When parsing a journal entry, GPT will:

- Map events to one or more stats (via the stat name or examples)
- Award XP accordingly
- Optionally remove XP or flag a negative stat event (e.g., _“Neglected kids to play video games”_ → loss of Fatherhood XP)

---

## 🖼️ UI Ideas for Stats Overview Page

Each stat could be shown with:

- **Stat name + description**
- **Current level** (with level title)
- **XP bar** (`275 / 300 XP`)
- **"Level up" button** (if eligible)
- **“View XP history”** button
- **“Edit stat”** button

Optionally:

- **“What earned me XP?”** report (auto-generated)
- **Top XP sources this week**
