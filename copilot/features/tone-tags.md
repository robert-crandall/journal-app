### 🧠 Feature: Emotion Tag Extraction for Journals (`tone_tags`)

#### **Overview**

Add support for extracting and storing emotional tone tags from daily journal entries. This provides a foundation for filtering entries by emotion and analyzing trends over time.

---

#### ✅ Requirements

- Add a new field to `JournalEntry`:

  ```ts
  tone_tags: string[] // max 2, constrained to fixed set
  ```

- **Allowed tags**:
  - `happy`
  - `calm`
  - `energized`
  - `overwhelmed`
  - `sad`
  - `angry`
  - `anxious`

- Tags are **automatically extracted** by GPT when the journal is marked `complete`.

- GPT Prompt Example:

  > Analyze the user's journal entry and extract up to 2 emotional tone tags from the following list: `happy`, `calm`, `energized`, `overwhelmed`, `sad`, `angry`, `anxious`. Only include tones that are clearly expressed or strongly implied. Prefer emotional tones that dominate the mood or are repeated, rather than fleeting moments.

---

#### 🔍 Nice to Have

- Basic UI on journal dashboard to:
  - Filter by a tone tag (e.g. "show me all sad entries")
  - Visualize frequency over time

---

#### 🧪 Acceptance Criteria

- [ ] `tone_tags` column or field added to journal model
- [ ] On journal completion, GPT analyzes and stores tone tags
- [ ] No more than 2 tags are stored
- [ ] Only values from allowed list are used
- [ ] UI can access and display tags for filtering
