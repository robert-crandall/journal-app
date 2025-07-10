### 📌 Issue: Negative XP and Stat Regression

**Goal**: Allow certain journal reflections or task outcomes to result in **negative XP**, representing setbacks or counter-aligned actions. This makes the stat system more emotionally accurate and helps users build awareness through pattern recognition.

---

### 🧩 Feature Requirements

- **Support Negative XP Entries**
  - Any XP grant record can include a **negative XP amount** (e.g., `-15 XP`)
  - The stat total is reduced accordingly
  - If XP drops below a level threshold, user stays at current level until manually leveling down (optional)

- **Journal-Based Negative XP**
  - GPT can infer situations that would reduce XP in a stat
    - E.g., journal says _“I ignored my son to play video games”_ → `-20 XP in Fatherhood`
    - Or _“I skipped the gym all week and felt sluggish”_ → `-10 XP in Strength`

- **Manual Tagging & Override**
  - User can manually log or correct negative XP:
    - “This task actually set me back”
    - “This journal entry didn’t reflect a regression”

- **Optional: Level-Locking**
  - User can choose to allow XP to go below a level threshold without auto-leveling down
  - Or enable **soft regressions** (e.g., a visual “XP dip” but level remains)

- **UI Feedback**
  - In XP history: show red entries for negative XP
  - Display stat change over time (e.g., XP line chart with dips)
  - Optional animation: “Oops, that hurt...” (without shaming)

- **Reflection Prompting**
  - GPT can follow a negative XP moment with a compassionate follow-up:

    > “Looks like that day didn’t align with your Fatherhood values. Want to create a reconnect task for tomorrow?”

---

### 🧠 GPT Integration Notes

- GPT can:
  - Assign negative XP based on tagged stat and journal tone
  - Explain gently _why_ XP was lost
  - Suggest a task or reflection to repair the trend
  - Avoid blame — use affirming, curious tone

---

### ✅ Acceptance Criteria

- [ ] XP entries can include negative values
- [ ] Journal analysis supports GPT assigning negative XP when warranted
- [ ] UI reflects stat regression in a non-judgmental way
- [ ] User can override or log negative XP manually
- [ ] Optional: Level thresholds can be enforced or bypassed
- [ ] GPT can suggest repair tasks or reframe moments compassionately
