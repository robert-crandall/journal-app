### 📌 Issue: GPT-Assisted Goal Reflection & Revision

**Goal**: Enable GPT to periodically help the user **reflect on their active goals**, assess alignment, and gently suggest updates, revisions, or archiving based on recent actions, tone, and journal entries.

---

### 🧩 Feature Requirements

- **Goal Reflection Trigger**
  - Trigger GPT reflection:
    - After a week of journal entries
    - After finishing a major quest or experiment
    - Manually from the goal dashboard (“Reflect on this goal”)
    - Automatically if a goal has had **no related activity for X days**

- **GPT Prompt Input**
  - GPT is given:
    - The goal's title and description
    - Related journal entries
    - Recent tasks or quests tied to that goal
    - Tone/mood tags from journals
    - XP stats (optional)
    - Activity timeline (e.g., nothing related for 2 weeks)

- **Types of GPT Output**
  - Insight:

    > “This goal has been present in your thoughts but hasn't shown up in your actions lately. Is it still important to you?”

  - Encouragement:

    > “You're actively working toward your goal of being outdoors more — great job! Would you like to deepen this with a new adventure?”

  - Gently questioning relevance:

    > “You haven’t done anything tied to this goal in 3 weeks. Has your focus shifted, or should we rewrite it?”

  - Suggested revisions:

    > “This goal might be clearer if reframed as: _'Create a weekly nature ritual with my kids.'_ Want to use that?”

- **User Response Options**
  - “Keep as-is”
  - “Archive this goal”
  - “Revise title/description” (inline editing)
  - “Set new quest/adventure based on suggestion”

---

### 🧠 GPT Integration Notes

- GPT prompt should be **empathetic, brief, and personalized**, with no pressure
- Responses should:
  - Mirror the tone of recent reflections
  - Encourage insight, not guilt
  - Offer 1 suggestion max per interaction

---

### ✅ Acceptance Criteria

- [ ] GPT can summarize recent alignment with a goal
- [ ] GPT can suggest keeping, revising, or archiving a goal
- [ ] User can take quick actions (edit, archive, generate new content)
- [ ] Reflection can be triggered manually or contextually
- [ ] GPT respects the user’s emotional tone and avoids judgment
