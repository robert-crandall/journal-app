## ✅ Weekly & Monthly Summaries for Journal Context

````
### 🧠 Feature: Weekly & Monthly Summaries

Add system-generated summaries of weeks and months to provide GPT with richer context during journal entry conversations.

---

### ✅ What to Build

#### 1. New Table: `journal_summaries`
This table will store summaries of journal content aggregated over time.

```ts
{
  id: uuid,
  period: 'week' | 'month',
  startDate: date,  // Saturday for weeks, 1st of month for months
  endDate: date,    // Friday for weeks, last day of month
  summary: text,    // Generated long-form summary (used for GPT context)
  tags: string[],   // Optional: top tags extracted from entries
  createdAt: timestamp
}
````

* One summary per period.
* Summaries are generated via GPT and stored in full.
* Could be scheduled as a cron job or triggered manually.

#### 2. Logic

* Aggregate all journal entries for the given period.
* Extract top themes, moods, wins, and challenges.
* Generate a human-readable summary via GPT.
* Store the result in `journal_summaries`.

#### 3. GPT Usage

* When a user starts a new journal entry or a GPT conversation about a past entry:

  * Load the relevant **weekly** and **monthly** summaries.
  * Prepend them to the GPT context to provide emotional and thematic background.

---

### 🧠 Why It Matters

* Provides GPT with long-term memory of how a user’s month or week has gone.
* Useful for trend spotting, emotional awareness, or connecting journal dots.
* Builds toward future features like XP trend analysis, check-ins, and guided self-reflection.

---

### 📌 Notes

* Ensure summaries are recomputable if older journals are updated.
* Can be extended later to include rating trends, stat deltas, etc.
* User annotations or editable summaries
---
