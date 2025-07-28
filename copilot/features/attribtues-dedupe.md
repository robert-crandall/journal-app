# Deduplicate Discovered Attributes 

**Description:**

As the system extracts journal-derived attributes (e.g. skills, interests, personality traits), the list can become noisy and redundant due to slightly different phrasing. To reduce clutter and improve clarity, we want to deduplicate only the **discovered attributes** — while preserving any **user-defined attributes**.

This will be done via a GPT-powered deduplication step, which will be **aware of the user-defined attributes** and avoid generating overlapping versions of those.

---

### Backend Implementation

- [x] Create GPT deduplication service in `backend/src/utils/gpt/`
- [x] Extend user attributes service with GPT integration
- [x] Update API endpoints to support GPT deduplication method
- [x] Write comprehensive tests for GPT deduplication
- [x] Verify all backend tests pass

### 🧠 GPT Prompt Design:

Send both sets to GPT like so:

```json
{
  "prompt": "Here is a list of user-defined attributes and a separate list of attributes discovered from journal entries. Please deduplicate and clean up the discovered list. Do not create duplicates of the user-defined attributes. Return a cleaned-up version of the discovered list only.",
  "user_attributes": ["Family-oriented", "Nature-lover", "Adventurer"],
  "discovered_attributes": [
    "Spends time with kids", "Plays with children", "Goes hiking",
    "Enjoys nature", "Explores outdoors", "Debugging", "Writes code", "Solves puzzles"
  ]
}
```

Example GPT output:

```json
[
  "Outdoor explorer",
  "Problem-solving and programming"
]
```

---

### 🎯 Implementation Notes:

* **Data Structure**: Attributes are already stored with `source` field: `"user_set"` vs. `"journal_analysis"` vs. `"gpt_summary"`
* **Preservation**: Only attributes with `source: "journal_analysis"` will be modified or deleted
* **Trigger**: Can be run manually via API or integrated into weekly summary generation
* **Error Handling**: Fallback to simple deduplication if GPT fails
