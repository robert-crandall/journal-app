### 🧠 Dungeon Master GPT Task Generator

**Goal:**
Create a GPT-powered system that generates **2 meaningful tasks per day** — one personal and one family-focused — based on rich context and user input. Inspired by a Dungeon Master offering quests, this tool draws from your character, life situation, and the “state of the world.”

---

#### ✅ Features

* **🧭 Morning Prompt**

  * Each morning (or first open of the day), ask the user:

    > *"What is the most important thing you can do today?"*
  * Response is optional.
  * If provided, it becomes part of GPT’s input and is prioritized when generating tasks.

* **🎯 Daily GPT Task Generation**

  * GPT suggests **2 tasks**:

    * **Personal Task** — aligned with goals, character, projects, plans (if their focus is aligned with daily focus), daily focus, weather, adventures.
    * **Family Task** — supports relationships and connection.
  * Tasks should feel narrative-driven and tied into ongoing efforts or emotional tone.
  * Generated tasks are added to the `simple_todos` table with `source = "gpt:dm"`, and expiration at midnight.

---

#### 🧠 GPT Context Inputs

* 🧬 **Character Sheet**

  * Stats, archetypes, personal growth areas.
* 🌱 **Goals**

  * Short- and long-term goals.
* 🔦 **Daily Focus**

  * Themed guidance for tone or domain (e.g. “Clean”, “Create”, “Connect”).
  * Plans if they align with the daily focus.

* 🏗️ **Projects & Adventures**

  * Any relevant plans that need traction.
* 📋 **Past Tasks**

  * Avoid repeat suggestions; build momentum.
* 🌤️ **Weather / Season**

  * Optional context for physical or mood-appropriate activities.
* 📔 **Journal Trends**

  * Use recent summaries (daily, weekly, monthly) for emotional alignment.
* 💡 **Today’s Intent**

  * If the user provided a “most important thing,” GPT should factor it in strongly.

---

#### 🛠️ Implementation Notes

* Store the morning answer in a `daily_intents` table:

  ```ts
  date: Date
  user_id: string
  importance_statement: string
  ```
* Tasks generated should reference this if relevant (for traceability).
* Tasks may include optional metadata:

  * `related_plan_id`
  * `focus_tag`
