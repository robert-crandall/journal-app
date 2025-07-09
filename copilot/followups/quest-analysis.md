### 📌 Issue: Quest Reflections (GPT-Based Summary & Analysis)

**Goal**: After a quest ends, GPT analyzes the user’s journey — reviewing journal entries, task completions, tone tags, and XP changes — and generates a reflection that helps the user understand what they gained, what was hard, and what to focus on next.

---

### 🧩 Feature Requirements

#### 1. **Trigger Reflection**

* Triggered automatically when:

  * A quest is marked **completed**
  * OR the **end date passes**
* Can also be triggered manually via a “Reflect on this Quest” button

#### 2. **GPT Analysis Input**

GPT receives:

* The quest’s:

  * Title
  * Description
  * Dates
  * Tasks completed (with timestamps and associated XP/stat tags)
* All **journal entries** made during the quest window

  * Includes content tags, tone tags, and stat tags
* Optional user notes or manual input (future feature)

#### 3. **GPT Output**

GPT returns a reflection including:

* **Reflection Summary**: A 3–5 sentence summary of what happened and how it went
* **Growth Analysis**:

  * What character stats improved (and why)
  * Notable journal moments or emotional shifts
  * Strengths demonstrated and areas of difficulty
* **Forward Guidance**:

  * Suggestions for what to do next
  * Possible new quests or experiments to consider

#### 4. **Display in Quest Page**

* Reflections appear at the bottom of the quest’s dashboard view
* Include ability to re-generate or edit
* Reflections are timestamped and saved in the database

---

### ✨ Example GPT Output

> **Reflection Summary:**
> During your "Reconnect with Nature" quest, you completed 5 hikes and consistently reflected on how grounding the outdoors felt. You gained 40 XP in Strength and saw notable increases in Calm tone tags.

> **Growth Analysis:**
> You showed consistency and resilience despite poor weather. Your journal entries revealed a transition from anxious to more centered. The most meaningful moment seemed to be your hike with your son.

> **Next Steps:**
> Consider a follow-up quest like "Sunrise Walks" or an adventure with more family involvement. You might also journal about how nature supports your parenting and mental clarity.

---

### ✅ Acceptance Criteria

* [ ] GPT can analyze quests based on tasks and journals within the date range
* [ ] Reflection includes summary, growth insights, and forward guidance
* [ ] Reflection is saved and shown on the quest page
* [ ] Reflection can be re-generated or edited
