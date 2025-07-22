## 🧠 Attribute Extraction During Summary Generation

### Feature Summary

During weekly and monthly summary generation, GPT should infer structured user attributes (like values, priorities, motivators, challenges) from journal entries and task history. These insights will populate the `user_attributes` table and improve personalization throughout the app.

---

### 🎯 Goals

- Automatically infer grouped user traits during summary creation
- Store them in a normalized format in `user_attributes`
- Respect previously user-set values and allow diffs

---

### 📥 Input Sources

Use the following data sources:

- All journal entries in the current summary window
- Prior user attributes for continuity

---

### 🧠 GPT Prompting

Prompt GPT with a format like:

> Based on these journal entries and task completions, extract meaningful user traits in the following format:
>
> ```json
> [
>   { "category": "priorities", "value": "family" },
>   { "category": "challenges", "value": "fatigue" },
>   { "category": "motivators", "value": "accomplishment" }
> ]
> ```

#### Inference guidelines:

- Traits should reflect patterns across multiple entries, not single events
- GPT should not duplicate traits already stored unless values have changed

---

### 🗃️ DB Behavior

- For each trait:
  - If new: insert into `user_attributes`
  - If changed: update source
  - If previously `user_set`: do not override without user review

---

### 🔎 Visibility

- Mark inferred traits with `source = gpt_summary`
- UI should display these separately from user-defined traits
- Add an audit trail of where each attribute came from (optional)

---

### 🚧 Edge Cases

- Avoid inferring too many traits in a single pass (limit to 5–10 per category)
- Allow null `importance` if GPT can’t reasonably assign one

---

### ✅ Acceptance Criteria

- [ ] Summary process adds/updates traits in the `user_attributes` table
- [ ] Traits are visible in the user dashboard with metadata (source, date)
- [ ] Traits influence daily GPT task generation and journal prompts
