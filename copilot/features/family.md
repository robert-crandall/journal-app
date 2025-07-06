### 📌 Issue: Family Management System

**Goal**: Add structured support for managing family relationships, enabling the app to help the user nurture meaningful connections through GPT-generated tasks, reflection, and time-based prompts.

---

### 🧩 Feature Requirements

- **Family Member Profiles**
  - Each family member includes:
    - **Name**
    - **Relationship** (e.g., _eldest son_, _wife_)
    - **Birthday** (optional)
    - **Likes** and **Dislikes** (freeform, comma-separated or list)
    - **Energy level** or personality trait (optional, e.g., “active”, “creative”, “low-key”)
    - **Last meaningful interaction date** (auto-updated)
    - (Optional) **Connection XP** (see below)

- **Task Feedback System**
  - For every completed task involving a family member, allow optional feedback:
    - “How did it go?” (freeform)
    - “Did they enjoy it?” (Yes / No)
    - Notes about the experience

  - This feedback is stored and passed to GPT as context

- **Time-Aware Nudging**
  - GPT should consider time since last interaction and surface connection tasks accordingly:

    > “It’s been four days since you did something with your youngest son. Want to try something outdoors today?”

- **Connection Tracking (Optional XP)**
  - Family members can optionally have a “connection stat” (e.g., _Connection Level 2 with Middle Son_)
  - Completing family-based tasks grants XP to this stat
  - XP history is viewable, helping answer:

    > “What did I do this week to bond with my wife?”

- **Relationship-Aware GPT Task Generation**
  - GPT should use:
    - Likes/dislikes
    - Feedback history
    - Last interaction time
    - Active quests or goals

  - To generate tasks like:

    > “Play catch with your middle son (he likes physical activity). It’s been 5 days since your last one-on-one time.”

---

### 🧠 GPT Integration Notes

- All family profiles and feedback data should be passed to GPT when generating daily connection tasks
- GPT should avoid repeating recently failed or disliked activities
- GPT should help maintain balanced connection frequency across all family members

---

### 🧾 Data Model

```ts
family_members {
  id: string
  user_id: string
  name: string
  relationship: string
  birthday?: Date
  likes: string[]
  dislikes: string[]
  energy_level?: string
  last_interaction: Date
}

family_task_feedback {
  id: string
  family_member_id: string
  task_id?: string
  date: Date
  liked: boolean
  notes: string
}

family_connection_xp { // optional
  id: string
  family_member_id: string
  date: Date
  source: "task" | "journal"
  xp: number
  comment?: string
}
```

---

### ✅ Acceptance Criteria

- [ ] User can create, edit, and delete family member profiles
- [ ] Each family member has a profile including name, relationship, likes/dislikes
- [ ] Task completions can be linked to family members with feedback
- [ ] GPT can access family context for generating tasks
- [ ] GPT considers time since last interaction and activity preferences
- [ ] (Optional) User can view XP history for family connections
