### 📘 Feature: Journal Entry Hybrid UX (Long-form + Chat)

**Description:**
The journal entry page should begin as a long-form writing space to encourage deeper initial reflection, with the option to transition into a GPT-powered chat *after* the user is ready. This lets users "dump" their thoughts freely before engaging in a guided, reflective conversation.

---

### ✅ Goals:

* Encourage stream-of-consciousness or long-form writing
* Defer GPT interaction until the user explicitly opts in
* Make the UI feel open and non-performative at first, then gradually shift into a conversational flow
* Allow saving the initial entry *without* chatting

---

### 🧱 UI Flow:

1. **Initial Long-Form Text Block**

   * Large single text input (textarea or editor)
   * Placeholder: *“Write about your day, your thoughts, or anything on your mind…”*
   * Buttons:

     * **Save Only**: Saves the journal entry as-is, no further GPT interaction
     * **Begin Reflection**: Transitions to chat mode using the saved text as context

2. **Transition to Chat Mode**

   * Original long-form text is shown as a single assistant message or formatted block
   * GPT begins asking follow-up questions or offering observations
   * Subsequent replies follow a chat layout (alternating user/assistant bubbles)

---

### 🧪 Acceptance Criteria:

* [x] Journal page starts with a long-form editor and no visible GPT/chat UI
* [x] User can save the entry without initiating chat
* [x] User can click **Begin Reflection** to transition into GPT chat mode

  * [x] GPT is seeded with the saved text and optionally user context (focus, goals, etc.)
* [x] Chat responses are stored alongside the journal for later review
* [x] Reopening an in-progress journal entry should respect the current mode (text or chat)

---

### ✨ Stretch Features:

* Auto-save draft every 30 seconds
* GPT summarizes the initial text before asking questions
* UI toggle to "always use chat mode" for future entries
