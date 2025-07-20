## 🧠 Enhance GPT Context for Journal Conversations (Layered + Hybrid Daily Logic)

### Summary

Improve GPT’s ability to understand trends and context in journal conversations by layering in the following to the conversational journal:

* Monthly summaries
* Weekly summaries
* Daily journals (with selective assistant replies)

---

### ✅ Acceptance Criteria

#### 🗓️ Daily Journal Context (7–14 days)

* [ ] **Include 7-14 days worth of daily journal entries.**

  * Should include at least the latest 7 days worth of journal entries
  * Also include enough to cover until the last weekly summary starts
  * Example: If last weekly summary ends **July 12**, start daily entries on **July 13**.
  * Prefer most recent 7–14 entries available after the last weekly summary.

* [ ] **Include assistant responses for the most recent 3–5 daily entries only.**

  * Older daily entries (day 4 through day 14) include only the user’s `initial_message`.
  * Assistant replies are pulled from `chat_session` field (if available).
  * Logic for assistant inclusion:

* [ ] **Formatting**
  Use this layout:

  ```
  🗓️ July 15
  User: "Had a tough time getting started today..."
  Assistant: "You might try easing into your focus tasks with a warm-up ritual."

  🗓️ July 14
  User: "Feeling burned out. I think I need a reset."
  ```

#### 📅 Weekly Summaries

* [ ] Include up to **3 weekly summaries**, prioritizing:

  * The most recent 2, which summarizes at least 7 days ago based on the summary end date.
  * Format:

    ```
    📅 Weekly Summary: July 6–12
    You made steady progress toward consistency...
    ```

#### 📆 Monthly Summaries (Optional)

* [ ] Include **up to 2** monthly summaries, which summarizes time older than the the start date of the weekly summaries.
* Format like:

  ```
  📆 Monthly Summary: June 2025
  This month was about reconnecting with routines and exploring new plans...
  ```

---

### 🛠️ Implementation Notes

* Be sure to dynamically determine:

  * The latest weekly summary’s end date
  * The available range of daily journals after that
* Token budget:

  * Prioritize recency and trimming assistant replies if hitting limits
  * Consider trimming messages per day or summarizing them in the future
* Entry Sources:

  * `journal.initial_message`
  * `journal.chat_session` (JSON format)
  * Weekly/monthly summaries

---

### 🚀 Benefits

* Better trend awareness across time
* Reduced repetition from assistant
* More natural reflection and forward-looking suggestions
* Maintains performance by balancing message volume with assistant inclusion
