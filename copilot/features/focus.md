### 🗓️ Feature: Daily Focus System

**Description:**
Allow users to define a daily “focus” that influences GPT task generation and provides thematic structure to each day (e.g. "Call to Adventure" for Saturdays, "Reset & Prepare" for Mondays). This supports consistent rhythm and intentional living.

---

**Acceptance Criteria:**

* [ ] User can define 1 focus per day of the week
* [ ] Each focus has:

  * A **title** (e.g. "Call to Adventure")
  * A **description** (e.g. "Saturdays are for doing something bold or memorable")
* [ ] GPT context includes today’s focus for task generation
* [ ] Focuses are editable at any time
* [ ] UI clearly shows the current day’s focus on the homepage

---

**Design Notes:**

* Store as a table keyed by `user_id`, `day_of_week`, `title`, `description`
* Optional: Preload sample focus presets for faster onboarding
