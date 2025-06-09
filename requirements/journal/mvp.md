# 📝 Journal MVP Feature List

### 📘 1. **Start a New Journal Entry**

* [ ] Button to start a new journal
* [ ] User responds with freeform text
* [ ] GPT responds, **conversation style** ("It's nice to hear you did X"), asks a few follow up questions based on responses

  * User may finish the journal at any time

---

### 🧠 2. **GPT Compiles Final Journal Entry**

* [ ] GPT receives entire conversation history
* [ ] Outputs a **cohesive entry** written in user's voice and tone

---

### 📦 3. **Metadata Extraction (via GPT)**

* [ ] GPT extracts metadata from the final compiled entry:

  * **Title** – Human-readable title for the entry
  * **Condensed Summary** – 1–2 sentence “what happened” version
  * **Full Summary** – GPT rewrite of full entry (same tone, cleaned up)
  * **Tags** – Existing tags only (unless no match is found)

---

### 📂 4. **Store & Display Journal Entries**

* [ ] Saved entries include:

  * Final journal text
  * Title, condensed summary, and full summary
  * Tags
  * Timestamp
* [ ] Journal list UI with:

  * Title
  * Condensed summary
  * Date

User can edit any of these fields

---

### ✅ 5. **Submit Flow**

* [ ] When user taps “Submit Journal”:

  * Saves journal
  * Runs GPT metadata extraction
  * Returns to journal dashboard with confirmation animation/sound (optional)
