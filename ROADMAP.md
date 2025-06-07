### 🧑‍💻 User System (Expanded)

#### 🔐 Authentication

* [x] User can register (username/email + password)
* [x] User can log in and maintain session
* [x] Session or JWT token is stored securely
* [x] Auth middleware protects user routes

#### 🧍 User Context

* [ ] User can define/update attributes as a key/value pair (e.g., { values: "honesty", "playfulness" })
* [ ] Each record should be stored in a new DB row. IE, "honesty" and "playfulness" are each a unique row.
* [ ] User can select GPT tone or interaction preferences (e.g., direct vs nurturing)

#### 👨‍👩‍👦 Family Members

* [ ] Add/edit family members (name, age)
* [ ] Family members also have attributes stored as key/value pair
  * Maybe family members should have their own users created, in order to make things like attributes easier?
* [ ] GPT uses family context to shape task suggestions

#### 🧠 Task Feedback

* [ ] Store task completion status (complete/skipped/failed)
* [ ] Store optional freeform feedback per task
* [ ] Categorize feedback (e.g., success, frustration, confusion)
* [ ] Feedback becomes input for future GPT task adaptation

---

### 🗓️ **Daily Focus**

* [x] User can define Focus types (name + description)
* [x] Store Focus types in DB per user
* [x] UI to display, create, and edit Focus types
* [x] Allow assigning Focus to each day of the week
* [ ] Display the week’s Focus map visually
* [ ] Support changing Focus of a single day
* [ ] Expose this mapping to GPT in daily task generation

---

### 🧠 **GPT-Powered Tasks**

* [ ] GPT generates primary task aligned to today’s Focus
* [ ] GPT generates secondary task focused on connection (e.g., kids)
* [ ] Tasks incorporate user context (family, energy, preferences)
* [ ] GPT adapts based on prior task feedback (e.g., “This frustrated Ian…”)
* [ ] Tasks linked to one or more Levels for XP tracking
* [ ] User marks task complete/skipped/failed
* [ ] Optional user feedback (text + emotion tag)
* [ ] XP gain logged for relevant Level
* [ ] Show tasks and completions in dashboard

---

### 🎚️ **Level System**

* [ ] User defines Level types (e.g., “Vitality”, “Creativity”)
* [ ] Each Level has a name, description, XP, and level number
* [ ] Tasks earn XP toward one or more Levels
* [ ] XP bar and level shown in dashboard
* [ ] Optional UI to view progress across Levels
* [ ] Optional GPT-generated ideas to raise low levels

---

### 📓 **Journaling**

* [ ] User enters freeform journal text
* [ ] GPT returns optional follow-up prompts to go deeper
* [ ] Final submission triggers:

  * GPT summary of journal
  * Tag extraction (e.g., “energy”, “kids”, “frustration”)
  * Tagging aligned to user-defined or common categories
* [ ] Display journal entry summaries in log
* [ ] GPT uses journal history to inform task suggestions and insights
