# 🧭 Epic: Reinstate Reflective Journal Mode (No Chat)

**Goal:**
Transform v2’s “finish journal” mode into the primary journaling experience — combining a *daily question*, *user-authored entry*, and *AI reflection* (based on previous entries, summaries, and personal synopsis data).
Remove conversational behavior entirely.

---

## 🗂️ Milestone 1 — Daily Question of the Day

> **Purpose:**
> Each day starts with a single meaningful prompt derived from prior context.
> This question encourages the user to reflect, not report.

**Tasks:**

1. **Generate one question per day per user**

   * Query the last few entries and `journals.synopsis` for recurring topics or tone trends.
   * LLM prompt example:

     > “Based on these entries and synopsis, generate one reflective question that invites introspection and continuity.
     > The tone should be warm and curious, not analytical.”

2. **Persist the question** in a new table or existing journal metadata:

   * Fields:
     `id`, `user_id`, `date`, `question_text`, `context_source` (e.g., "fatigue pattern"), `answered:boolean`.

3. **Display flow:**

   * When user opens the app, show today’s question prominently above the entry field.
   * If a question already exists for today, reuse it.
   * Once the user submits their entry, mark `answered=true`.

**Definition of done:**
Users see *exactly one personalized question per day*, tied to context and remembered for that date.

---

## 🗂️ Milestone 2 — Reflection Agent Integration (Post-Entry Summary)

> **Purpose:**
> Once a user writes their daily reflection, generate an *AI reflection paragraph* about the day — drawing from their entry, prior context, and `journals.synopsis`.

**Tasks:**

1. **Use the existing metrics agent** for data extraction (unchanged).
2. **Add a reflection agent** (new system prompt):

   ```
   You are a reflective companion. 
   Read the user's daily journal entry, the last 3 entries, and the user's synopsis (personality, preferences).
   Write a short paragraph (3–5 sentences) that helps the user see meaning, progress, or connection in their day.
   Do not summarize or quantify. 
   Sound thoughtful, observant, and human.
   ```
3. **Store reflection output** in a new field (e.g., `journals.reflection_text`).
4. **UI display:**

   * Appears below the user’s entry after submission, like “AI Reflection for Today.”
   * Never appears in real time (no chat UX).

**Definition of done:**
After submitting an entry, the user receives one reflective paragraph that feels personal and meaningful — not analytical.

---

## 🗂️ Milestone 3 — Integrate with Memory (`journals.synopsis`)

> **Purpose:**
> Use the existing synopsis field for continuity and richer reflections.

**Tasks:**

1. Reflection agent fetches:

   * `journals.synopsis` (user profile summary)
   * 3 most recent journal summaries
   * Most recent question of the day
2. Include this in the LLM context for both daily question and reflection generation.
3. Optionally, after each reflection, auto-update `journals.synopsis` using a summarization job that rolls in recent patterns.

**Definition of done:**
Reflections and questions consistently “remember” who the user is and reference past themes accurately.

---

## 🗂️ Milestone 4 — Streamline Journaling Flow (Question → Entry → Rating → Reflection)

> **Purpose:**
> Create a single seamless daily flow that feels natural and closed-loop.

**Flow:**

1. User opens app → sees **Question of the Day.**
2. Writes daily paragraph.
3. Submits entry → prompted for daily rating (1–5).
4. Metrics agent extracts structured data silently.
5. Reflection agent generates paragraph.
6. Display rating + reflection summary.

**Definition of done:**
Daily journaling feels cohesive — not multi-screen or conversational.
User flow mirrors v1’s pre-chat rhythm, with one thoughtful AI reflection per entry.

---

## 🗂️ Milestone 5 — Optional Future: Pattern-Based Reflection Triggers

> **Purpose:**
> Periodically (weekly, monthly), the system can surface higher-level reflections when a pattern emerges (e.g., “energy improvements,” “family time consistency”).

**Tasks:**

1. Weekly job analyzes metrics + entry text.
2. Detect recurring tags or sentiment shifts.
3. Trigger one reflective insight post (stored like a journal reflection).
   Example:

   > “You’ve been mentioning better sleep for three weeks — it looks like your new routine is stabilizing.”

**Definition of done:**
System can generate meta-reflections over time — without requiring chat or user prompts.

---

## 🧩 Summary of What’s Changing vs Staying

| Category           | v2 Current                 | After These Milestones                                              |
| ------------------ | -------------------------- | ------------------------------------------------------------------- |
| **Chat**           | Exists, optional           | Removed as primary interface                                        |
| **Daily question** | None                       | Added; one contextual question/day                                  |
| **Reflection**     | None (metrics only)        | Added post-entry paragraph                                          |
| **Memory**         | `journals.synopsis` exists | Used for continuity & personality context                           |
| **Rating**         | Exists                     | Kept; no reflection prompt                                          |
| **Metrics agent**  | Exists                     | Remains unchanged                                                   |
| **Flow**           | Report-like journaling     | Restored reflective rhythm (question → write → rating → reflection) |

---

## 🧱 Development Order

1. Milestone 1 – Daily Question of the Day
2. Milestone 2 – Reflection Agent Integration
3. Milestone 3 – Memory Integration (using `journals.synopsis`)
4. Milestone 4 – Unified journaling flow (link all together)
5. Milestone 5 – Pattern-based reflections (stretch)
