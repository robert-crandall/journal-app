## 🧠 User Attributes Table (Grouped Insight Tracking)

### Feature Summary

Create a `user_attributes` system to track grouped personal traits such as priorities, values, motivators, and challenges. This table will be:

- Populated via GPT inference during weekly/monthly summary generation
- User-visible and editable in the UI
- Used by GPT to personalize task suggestions, journal prompts, and summaries

---

### 📐 Schema Design

Create a new table:

```sql
user_attributes (
  id UUID PK,
  user_id UUID FK,
  category TEXT,        -- e.g. "priorities", "values", "motivators"
  value TEXT,           -- e.g. "family", "relaxing", "physical health"
  source TEXT,          -- "user_set", "gpt_summary", "journal_analysis"
  last_updated TIMESTAMP
)
```

---

### 🧭 Behavior

#### 🛠 Inference Logic

- Attributes are inferred during weekly and monthly **summary generation**
- GPT reads the full conversation history or journal logs for that period
- GPT outputs structured suggestions like:

  ```json
  {
    "category": "priorities",
    "value": "physical health",
    "importance": 4,
    "source": "gpt_summary"
  }
  ```

#### 👤 User Interface

- Users can:
  - View grouped attributes
  - Add new traits manually
  - Remove ones that don’t feel accurate

#### 🤖 GPT Access

- Attributes are automatically included in:
  - Dungeon Master GPT (daily task gen)
  - Journal prompts
  - Reflection suggestions

- Attribute data is summarized like:

  ```
  Priorities: family, physical health
  Motivators: control, creativity
  ```

---

### 🧪 Implementation Notes

- Consider uniqueness constraint on `(user_id, category, value)`
- Run attribute inference only on **completed summaries**, not partial
- Optional: surface attribute diffs week-to-week in user dashboard (“New trait detected: ‘autonomy’”)
