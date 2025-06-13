## 🧠 App Purpose

This app helps users understand whether the self-experiments they run are actually improving their life. It does this through a **conversational journal** powered by GPT, which guides users to reflect on their day, extract key patterns, and tie experiences to broader personal development goals.

It is built for **INTJ individuals with ADHD**, meaning it prioritizes structure, minimal friction, and deep insight over superficial checklists or open-ended note dumping.

---

## ✍️ Journal System (Conversational Entries)

The core of the app is a **guided journal** powered by GPT. After writing a freeform journal entry or answering a few opening prompts, GPT will ask **follow-up questions** to help deepen reflection and uncover context. Once the conversation is complete, GPT will extract structured insights:

* **Summary**: A narrative rewrite of the conversation that reflects the user's tone and voice.
* **Synopsis**: A short 1–2 sentence overview of what happened that day.
* **Title**: A 6–10 word title that captures the essence of the day.
* **Content Tags**: 3–6 topic-based tags describing what happened (e.g., "sleep", "relationship"). Prefer existing tags, but allow new ones if appropriate.
* **Tone Tags**: Mood-based labels drawn from a **predefined set** (e.g., "overwhelmed", "calm", "frustrated"). Multiple tone tags can be assigned to one entry.
* **Character Tags** (renameable): Reflect which personal growth stats were used or developed during the day (e.g., "strength" from a workout). Strictly choose from existing stats.

Each journal entry can optionally be **linked to one or more self-experiments**, but does not depend on them. Deleting a self-experiment does **not** delete the journal entry.

---

## 🔬 Self-Experiments (Quests)

Experiments are structured challenges designed to test lifestyle changes. Each experiment includes:

* **Title** and **description**
* **Start and end date**
* A daily checklist task (e.g., “Did you avoid social media today?”) that the user marks complete
* Optional journaling integration — journal entries can be viewed from the experiment, but are stored independently

### Experiment Dashboard

Each experiment has a dashboard that shows:

* How many daily tasks were completed
* Associated journal entries
* A breakdown of extracted tags:

  * **Content Tags**: Displayed as a simple list or word cloud
  * **Tone Tags**: Displayed as a bar chart, showing the count of each tone
  * **Character Tags**: Show which stats were involved and how much XP was gained

This overview helps the user quickly see how their emotional tone, focus areas, and personal growth patterns evolved across the experiment.

---

## 🧬 Character Stats (Renameable: e.g., Virtues, Traits, Aspects)

These are RPG-inspired stats that reflect the user’s personal development focus. Each stat has:

* A name (e.g., “Strength”)
* A short description (“The ability to lift heavy things”)
* A **current XP value**

### XP Sources

Stats gain XP in two ways:

1. **From journal entries**: If a journal includes that stat’s tag, it adds XP (e.g., +5 XP for "strength").
2. **From daily tasks in experiments**: Each task completion can reward XP to one or more stats (e.g., reading = +10 XP to "intelligence").

This makes progress feel tangible, gamified, and tied to actual behaviors — not just abstract tracking.

---

## 🛠️ CRUD Requirements (Behind the Scenes)

Everything listed — journal entries, tags, experiments, tasks, and character stats — must support:

* **Create** (add a new entry)
* **Read** (view or filter/search existing items)
* **Update** (edit past entries or definitions)
* **Delete** (remove if needed, with smart rules, like not deleting linked journals)
