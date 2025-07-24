## 🧠 Feature: Optional XP Grants from `tone_tags`

### Overview

Enable XP to be optionally granted based on the emotional tone of journal entries (`tone_tags`). This supports emotional growth, resilience, and self-awareness.

---

### 🔍 Motivation

Users want to track and reward emotional resilience or growth over time. For example:

- Feeling overwhelmed but still journaling = emotional strength
- Consistently noticing positive moods = reinforcement of good habits

This also supports correlation analysis between `day_rating`, `tone_tags`, and personal growth stats.

---

### 🗂️ Requirements

- [ ] Add optional XP grant logic linked to `tone_tags`

- [ ] Define a config/mapping file (or inline schema) like:

  ```ts
  {
    happy: { stat: "Emotional Wellbeing", xp: 1 },
    calm: { stat: "Emotional Wellbeing", xp: 1 },
    sad: { stat: "Resilience", xp: 2 },
    overwhelmed: { stat: "Resilience", xp: 2 },
    anxious: { stat: "Mindfulness", xp: 1 },
    grateful: { stat: "Gratitude", xp: 1 }
  }
  ```

- [ ] Prevent XP farming by:
  - Only granting once per tone per day
  - Optionally: Diminishing returns per week

- [ ] Grant XP automatically when journal is marked `complete` (if tone tags are present)

- [ ] Log these XP grants with source: `"tone_tag:<tag>"`

---

### ✅ Optional Enhancements

- [ ] UI in journal summary view: "You earned 2 XP for journaling through sadness today"
- [ ] Future correlations between `tone_tags`, `day_rating`, and behavior patterns
- [ ] Toggle in settings to enable/disable emotion-linked XP
