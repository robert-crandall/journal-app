### 📌 Issue: Family Connection Dashboard

**Goal**: Create a dashboard view where the user can see how often they’re connecting with family members, spot gaps, and quickly act to strengthen bonds.

This helps turn emotional labor into visible progress — a huge win for reflective, INTJ-minded users who want to be intentional about relationships.

---

### 🧩 Feature Requirements

- **Connection Overview**
  - Show each family member as a card or row with:
    - Name and relationship
    - Time since last interaction (e.g., “3 days ago”)
    - Likes/dislikes badges
    - Optional energy level or personality tag
    - Button to “Generate a task with \[Name]”

- **Connection Frequency Indicators**
  - Highlight when a family member is “due” for interaction based on spacing rules (e.g., _“every 3 days with youngest son”_)
  - Color indicators: green (recent), yellow (approaching), red (overdue)

- **XP Summary (if using connection stats)**
  - Show current **connection level** with each family member
  - Show XP gained in the **past week / month**
  - Optional: Add “Level Up” visual or mini title for humor/personality

- **Activity History**
  - For each family member:
    - List recent activities, feedback, and XP awarded (if enabled)
    - Allow quick access to task or journal entries that included them

- **Quick Actions**
  - “Log a moment” → Manually enter an activity that wasn’t tracked via task
  - “Generate activity idea” → Ask GPT for something to do with that person today
  - “Set interaction spacing” (e.g., “remind me if it’s been more than 3 days”)

---

### 🧠 GPT Integration Notes

- GPT should be able to generate:
  - A brief “relationship summary” per person (e.g., _“You’ve done 3 things with your youngest son this week. He loved the hike, but didn’t enjoy board games.”_)
  - Suggestions for connecting again, based on gaps or new ideas

---

### 🎨 UI Notes

- Mobile-first layout: one card per family member
- Use avatars, color-coded spacing indicators, and short summaries
- Tap-to-expand for history or GPT suggestions
- Optional widget to show **“Who needs connection today?”**

---

### ✅ Acceptance Criteria

- [ ] Dashboard shows all family members and time since last connection
- [ ] Spacing rules trigger visual indicators for overdue connections
- [ ] XP and activity history are visible (if tracking is enabled)
- [ ] User can take action directly: generate task, log moment, ask GPT
- [ ] All data updates in real-time from task completions or journal reflections
