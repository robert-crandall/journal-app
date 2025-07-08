### 📌 Issue: Freeform Conversational Journal with GPT

**Goal**: Allow users to launch a freeform journal session in a conversational chat UI. The user starts by saying whatever’s on their mind, and GPT gently guides the conversation with thoughtful, emotionally intelligent follow-up questions. The entire session is saved as a journal entry with GPT-generated metadata.

This helps users reflect in a flexible, low-pressure way — ideal for both structured thinkers and spontaneous feelers.

---

### 🧩 Feature Requirements

* **Start Journal Session**

  * User can click a “Start Journal” button from the homepage
  * Session begins in a **conversational UI** (chat-like interface)
  * No predefined questions — the user writes the first message freely

* **GPT Follow-Up**

  * GPT responds to each user message with:

    * One brief observation (empathic, attentive)
    * One thoughtful follow-up question (not generic, not too long)
  * GPT mirrors the user’s tone — playful if playful, warm and calm if vulnerable

* **End Session**

  * After \~3–5 exchanges (or when the user says “done” or hits “End”), GPT summarizes and asks:

    > “Would you like to save this journal entry?”
  * If yes, GPT generates:

    * **Summary** (narrative-style, in user’s tone)
    * **Synopsis** (1–2 sentence snapshot)
    * **Title** (6–10 words)
    * **Tags** (3–6 from a list of content + tone tags, with ability to add new)
    * **Stat tags** (selected from existing character stats)

* **Save Entry**

  * The full conversation, plus GPT-generated metadata, is saved
  * Entry can be viewed or edited later in the journal log

---

### 🧠 GPT Integration Notes

* Uses the **shared GPT orchestration engine**
* Prompt context includes:

  * User’s class, backstory, and goals
  * Recent focus of the day (e.g., “Call for Adventure”)
  * Stat definitions and recent XP trends (optional)
* GPT tone and format are consistent:

  * Short reflection → one good question → repeat
  * Total length should feel digestible, never overwhelming

---

### ✅ Acceptance Criteria

* [ ] User can launch a journal session without prompts
* [ ] User types freely; GPT responds with thoughtful follow-ups
* [ ] GPT mirrors tone and maintains 1:1 conversational pacing
* [ ] GPT offers to save the entry after \~3–5 turns or on user command
* [ ] Journal entry includes: full conversation, summary, synopsis, title, tags, and stat tags
* [ ] Entry is saved to the database and can be accessed later
