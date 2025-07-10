### 🧠 Feature: GPT Journal Analysis Engine

**Description:**
Once a journal entry is submitted, GPT analyzes the text to extract meaningful insights, provide structure, and assign XP to relevant character stats. This helps the system reflect back what mattered most and track personal growth over time.

---

**Acceptance Criteria:**

- [ ] When a journal is finalized, GPT is called with the full journal text

- [ ] GPT returns the following fields:
  - **Summary**: Full narrative summary matching the user’s tone
  - **Synopsis**: 1–2 sentence version
  - **Title**: 6–10 words describing the day
  - **Content Tags**: 3–6 keywords based on events (can create new)
  - **Tone Tags**: Selected from existing predefined set
  - **Stat Tags**: Selected from existing user stats
  - **XP Map**: Map of stat ID to XP awarded

- [ ] Parsed data is saved to the journal record

- [ ] XP is automatically added to the corresponding stat

- [ ] XP is also recorded in an XP log for traceability (source: journal, journal_id, stat_id, xp)

---

**Prompt Design Notes:**

- Prompt should be modular and flexible for tone mirroring and tag extraction
- Should prefer existing tags (use autocomplete index or pass valid options to GPT)
- GPT response must be valid JSON and validated with schema before saving

---

**Developer Notes:**

- Use a shared service (`analyzeJournalEntry(journalText, context)`) so it can be reused later
- Store raw GPT request and response for debugging or fine-tuning
