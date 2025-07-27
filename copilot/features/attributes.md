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
  value TEXT,           -- e.g. "Enjoys watching movies more on second watching"
  source TEXT,          -- "user_set", "gpt_summary", "journal_analysis"
  last_updated TIMESTAMP
)
```

---

### 🧭 Behavior

#### 🛠 Inference Logic

- Attributes are inferred during journal analysis
- GPT outputs structured suggestions like:

  ```json
  {
    "attributes": [
      { "characteristics": "Enjoys watching movies more on second watching" },
      { "motivators": "Wants kids to grow up to be self-sufficient" }
    ]
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
  - Journal conversation

- Attribute data is summarized like:

  ```
  Characteristics: Enjoys watching movies more on second watching, Starts projects but has difficulty finishing
  Motivators: Wants kids to grow up to be self-sufficient
  ```

---

### 🧪 Implementation Notes

- Consider uniqueness constraint on `(user_id, category, value)`
- Optional: surface attribute diffs on journal summary page (“New trait detected: ‘autonomy’”)
