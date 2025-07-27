### 📌 Feature: Weekly Goal Alignment Summary

**Summary:**
Create a weekly goal alignment summary that analyzes journal entries, family interactions, XP progress, and character stats to determine how well the user is aligned with their stated goals. This will help users stay on track and surface meaningful insights and next steps.

---

### ✅ Tasks

- [ ] **New module**: Create a `goal_alignment.ts` module that:
  - Accepts journal entries, quests, character stats, and tone tags from a 7-day window
  - Evidence of progress toward active goals and quests
  - Identifies **neglected or conflicting goals**
  - Suggests **next actions** to realign with goals

- [ ] **Trigger on Weekly Summary**
  - This module should run automatically as part of the `generateWeeklyJournalSummary()` flow

- [ ] **Summarize** the week’s alignment in natural language:
  - What the user did that aligned with their goals
  - What they may have missed or ignored
  - Suggestions for what they could do next week

- [ ] **Save summary to database**
  - Schema should support:
    - `periodStartDate`
    - `periodEndDate`
    - `alignmentScore` (optional numeric 0–100 or simple status)
    - `alignedGoals` (array of goal IDs + evidence/excerpts)
    - `neglectedGoals` (array of goal ID + optional reason)
    - `suggestedNextSteps` (string\[])
    - `createdAt`

- [ ] **Display this summary** in the Weekly Review UI
  - Allow user to mark goals as complete or adjust them
  - Optionally annotate or reflect on summary

- [ ] **Link it to ongoing journal/experiment summaries**
  - Weekly summary may optionally pull data from those summaries
  - Include references to key journal entries or experiments

- [ ] **Optionally show comparison to previous weeks**
  - e.g. “More aligned than last week” or “Consistent with 3-week trend”

---

### GPT Prompt Suggestion (for devs integrating GPT)

```
You are a wise coach helping the user reflect on their week. Use their journal entries and active quests to determine where they lived in alignment with their goals and where they didn’t. Give specific examples, recommend small course corrections, and summarize what they might focus on next week to stay aligned with their long-term direction.
```

### 💡 Why This Matters

This feature helps close the loop between daily habits and long-term goals. Instead of relying on memory or effort to connect the dots, GPT can do the synthesis and surface meaningful direction in a friendly, narrative way. Saving it allows for continuity, coaching, and context over time.
