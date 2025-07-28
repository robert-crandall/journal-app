**Title:** 🧠 Combine Journal Summary and Goal Alignment into One Weekly Analysis

**Description:**

Currently, journal summaries and goal alignment summaries are two separate actions and pages. Let's streamline this into a single, unified experience.

---

### ✅ Goals:

- Provide a single entry point to generate both journal and goal alignment summaries.
- Display both summaries on a unified page with clear structure.
- Encourage reflection by showing both _what happened_ and _how it aligns with long-term goals_.

---

### ✨ Features to Implement:

#### 1. **Unified Action:**

- Add a new action: `Analyze My Week`
- Trigger both journal summary and goal alignment GPT tasks
- Include a loading state and success/failure handling for each

#### 2. **Unified Display:**

- Create a single **Weekly Analysis** page
- Three sections:
  - **Section 1: Journal Summary**
    - Tone, tags, family member mentions, highlight moments

  - **Section 2: Metrics Summary**
    - List of XP gained, tasks done, XP by stat, tone frequency, content tag frequency

  - **Section 3: Goal Alignment**
    - List of relevant goals and how journaled behavior aligned with them
    - Optionally includes rating or “% aligned” visual

#### 3. **Optional Combined GPT Reflection (Stretch Goal):**

- Generate a short summary that blends both sections into a paragraph or quote (e.g., “You spent time outdoors with your kids and made progress toward your Ranger goal.”)

#### 4. **Linkage:**

- Link to this new page from both the Journal and Goals section
- Retain ability to view journal or goal alignment independently if needed

### 🧪 Bonus Ideas:

- Add filters (e.g., show weeks where alignment was >80%)
- Add tags to the summary to allow searching later (“nature”, “family”, “disconnected”)

---

Let me know if you want me to break this into multiple smaller issues!
