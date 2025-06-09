### ✍️ **Unified Journal Interface Layout (Mobile-First)**

#### 1. **Header**

* **Date display**
* Optional: subtle animation/symbol for “new journal started”

---

#### 2. **Conversation Section** *(Primary focus)*

* Chat-style UI
* GPT responses alternate with user input
* Keep the GPT box always visible and animated subtly when thinking

---

#### 3. **"End Journal" Prompt Area**

Appears once the user stops responding or taps "End Session".

```plaintext
✅ Ready to finish?
📝 I'll write your entry — but first:
```

Below this prompt, stack 2 extra questions:

---

#### 4. **Mood Selector (Compact UI Element)**

```plaintext
How was your mood today?
[ 😞 😐 🙂 😄 😍 ] ← tap-to-select
```

* Use icons but back them with accessible labels
* Allow optional free-text like “Exhausted but proud”

---

#### 5. **Tomorrow's Focus or Goal**

```plaintext
What’s one thing you want to do or feel tomorrow?
[Text input]
+ (optional) Let GPT help brainstorm
```

---

#### 6. **Submit Button**

Big, satisfying, tactile button:

```plaintext
[ ✨ Finish My Journal Entry ]
```

On tap:

* GPT compiles entry
* Extracts metadata
* Stores mood + tomorrow’s goal

---

### 🧠 Why This Works for INTJ + ADHD

* **One flow, one page, progressive reveal** → no tabs or mode switches
* **Chat-first design** satisfies need for reflection without decision fatigue
* **"End of journal" section** acts like a gentle closure, not a modal or interrupt
* **Optional prompts** satisfy data capture without distraction
