### 🧭 Feature: Quests (Long-Term Goal Containers)

**Description:**
Quests are large thematic containers that represent long-term personal goals or seasons of life (e.g. “Reclaim My Health” or “Summer of Adventure”). They provide context and meaning to day-to-day activity, help reflect on progress over time, and organize life into meaningful chapters. Unlike Experiments, **Quests do not generate tasks** or influence daily todos, but they do influence GPT’s understanding of user priorities.

---

**Core Functionality:**

* [ ] Users can create, edit, and archive Quests

  * Fields: `title`, `summary`, `start_date`, `end_date`, `reflection` (freeform)
* [ ] Each Quest can be **linked to Experiments** and **journal entries**

  * Linkage should be automatic by date range, but also manually overrideable
* [ ] Each Quest has a dashboard displaying:

  * [ ] All linked experiments (title + completion status)
  * [ ] All journal entries during the quest timeframe
  * [ ] XP gained by stat (e.g. Strength: 180 XP, Fatherhood: 120 XP)
* [ ] GPT can be fed Quest context when assigning tasks or generating journal summaries

  * Use active Quests only
  * Use Quest summary as high-level goal framing

---

**Design Notes:**

* Quests are meant for **reviewing seasons**: quarterly, annually, etc.
* Think of them like "chapters" in the story of a life
* Quests do not contain or generate tasks directly — this is handled by Experiments
* XP counts are based on journal-linked stat tags during the quest's active dates

---

**Later Plans:**

* Generate a “Quest Retrospective” report via GPT
