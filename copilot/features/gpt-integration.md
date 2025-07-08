### 📌 Issue: GPT Integration for Conversational Journal & Post-Analysis

**Goal**: Integrate GPT into the journal service to power both the real-time conversation with the user and the automatic analysis once the session is complete. GPT will act as an emotionally intelligent life coach, then summarize and extract structured metadata.

---

### 🧩 Feature Requirements

#### 1. **Conversational Flow**

- User starts a journal session (freeform)
- GPT receives each user message and responds with:
  - A brief, emotionally intelligent observation
  - One thoughtful follow-up question

- GPT mirrors the user's tone (serious, playful, vulnerable, etc.)
- GPT stops prompting when the user ends the session

#### 2. **Post-Journal Analysis**

After the conversation ends, GPT will:

- 📝 **Summary**: Rewrite the full journal as a first-person narrative, in the user’s tone
- 🔍 **Synopsis**: Condense the entry to 1–2 high-level sentences
- 🧠 **Title**: Create a 6–10 word title that captures the day
- 🏷 **Content Tags**: Extract 3–6 tags describing what the day involved (e.g., "relationship", "rest", "focus")
- 🎭 **Tone Tags**: Select emotional tone(s) from a predefined list (e.g., "calm", "frustrated", "joyful")
- 🧗 **Stat Tags**: Tag relevant character stats (from user-defined list), based on described actions
- ⭐ **XP Assignment (Optional)**: Provide a breakdown of XP earned per stat (if present)

---

### 🧠 GPT Prompt Design

- Prompt includes:
  - Full journal conversation
  - User’s class, backstory, goals, character stats, and focuses
  - Recent task history (optional)
  - Instructions on how to respond and what fields to generate

- Response format should return structured JSON:

```json
{
  "summary": "...",
  "synopsis": "...",
  "title": "...",
  "content_tags": ["..."],
  "tone_tags": ["..."],
  "stat_tags": [
    { "stat": "strength", "xp": 10 },
    { "stat": "fatherhood", "xp": -10 }
  ]
}
```

---

### ✅ Acceptance Criteria

- [ ] GPT powers a real-time journal conversation
- [ ] GPT uses consistent tone-aware response structure
- [ ] GPT generates structured metadata after journal ends
- [ ] Metadata is saved alongside the journal entry
- [ ] XP awards are attached to stat records (if present)
- [ ] GPT prompt can be reused for other reflection flows (modularized prompt structure)
