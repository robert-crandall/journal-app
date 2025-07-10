### 📖 Feature: Freeform Journal System

**Description:**
Allow users to launch a journal session and write freely about their day. Journals are conversational in tone and may be written in a single go or revisited throughout the day. Once saved, GPT will analyze the entry to generate meaningful insights and structured metadata.

---

**Acceptance Criteria:**

* [ ] User can **start a new journal entry**
* [ ] User can **edit the journal entry** before submitting
* [ ] User can **view and browse past journal entries**
* [ ] Journals are **tied to a single date** (1 per day, but can be revisited until finalized)
* [ ] When finalized, journal is **sent to GPT for analysis**:

  * Summary (full narrative based on user’s tone)
  * Synopsis (1–2 sentence version)
  * Title (6–10 words describing the entry)
  * Content tags (e.g. "sleep", "relationship", "fun")
  * Tone tags (e.g. "overwhelmed", "hopeful")
  * Stat tags (linked to existing character stats, for XP assignment)

---

**Design Notes:**

* Journals should support Markdown-style editing
* Each entry will store:

  * `refined_summary`
  * `synopsis`
  * `title`
  * `tags_content[]`, `tags_tone[]`, `tags_stats[]`
  * `xp_gained[]` with per-stat mapping
  * GPT request and response logs (optional for audit/debug)
* Each tag should prefer existing entries (autocomplete), but allow new ones for content tags only

---

**Stretch Goals:**

* Add chart view showing tags/stat trends over time
