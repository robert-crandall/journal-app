### 🔬 Enhancement: Experiment Reflection & Repeatability

**Purpose:**
Add lightweight reflection functionality to Experiments, so users can reflect on what worked and whether it's worth repeating.

---

**New Fields to Add:**

- `reflection`: `TEXT`
  - Freeform field for user to jot down reflections like “worked well,” “too ambitious,” or “got sick halfway.”

- `should_repeat`: `BOOLEAN`
  - Simple toggle: would I do this again?
  - Can be used to suggest recurring or seasonal experiments.

---

**UI Enhancements:**

- [ ] Add a "Wrap Up" section once an experiment ends:
  - Prompt user: **"How did it go?"** with a large text box
  - Checkbox or toggle: **"Would you repeat this?"**

- [ ] Display this info on the experiment dashboard or detail view
