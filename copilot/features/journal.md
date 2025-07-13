### 📘 Feature: Journal System

**Goal:**
Create a journal system that encourages intentional, long-form reflection first, followed by optional AI-guided exploration. Each journal entry moves through a clear lifecycle: `draft` → `in_review` → `complete`.

---

### 🧱 Core Concepts

#### 🗓 One Journal Entry per Day

- Each user can create **only one journal entry per day**
- Journal is accessed via `/journal/[YYYY-MM-DD]`

#### 📊 Journal Status Lifecycle

| Status      | Description                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------- |
| `draft`     | User is writing an unstructured freeform reflection (`initial_message`)                         |
| `in_review` | User starts a chat to reflect more deeply. A `chat_session` begins with their `initial_message` |
| `complete`  | Journal is finalized; GPT summarizes and tags it                                                |

---

### 📦 Data Model

```ts
Journal {
  id: string (uuid)
  user_id: string (FK)
  date: Date (unique per user)
  status: enum('draft', 'in_review', 'complete')
  initial_message: text
  chat_session: jsonb | null
  summary: text | null
  title: text | null
  synopsis: text | null
  tone_tags: string[]
  content_tags: string[]
  stat_tags: string[]
  created_at: timestampz
  updated_at: timestampz
}
```

- `chat_session` will always start with:

  ```json
  [
    { "role": "user", "content": "initial_message" },
    { "role": "assistant", "content": "..." },
    ...
  ]
  ```

---

### 🧠 GPT Interaction

- **While in `draft`:**
  - User can edit `initial_message`
  - User can save `initial_message` at any time
  - No GPT involvement yet

- **Transition to `in_review`:**
  - Freezes `initial_message`
  - Begins `chat_session` with GPT
  - User and GPT exchange messages (stored as JSON objects)

- **Transition to `complete`:**
  - GPT analyzes journal and outputs:
    - `summary`
    - `synopsis`
    - `title`
    - `tone_tags`, `content_tags`, `stat_tags`

  - These are displayed on journal view

---

### 🖥️ UI Behavior

#### Homepage

- If journal doesn't exist for today → show "Write Journal"
- If journal exists:
  - `draft`: "Continue Writing"
  - `in_review`: "Resume Reflection"
  - `complete`: "View Entry"

#### Journal Page

- Single editor view at `/journal/[YYYY-MM-DD]`
- If `status === 'draft'`:
  - Show large textarea
  - Show button: "Start Reflection"

- If `status === 'in_review'`:
  - Show existing `chat_session` in chat format
  - Show chat input at bottom
  - Button: "Finish Journal"

- If `status === 'complete'`:
  - Display metadata (summary, tags, etc.)
  - Read-only view of full journal

---

### ✅ Acceptance Criteria

- [ ] Journal model with required fields
- [ ] One journal per user per day, identified by date
- [ ] Support lifecycle states: `draft`, `in_review`, `complete`
- [ ] Initial message editor (draft mode)
- [ ] GPT chat session support (in_review mode)
- [ ] Metadata generation via GPT (complete mode)
- [ ] Routes and UI for `/journal/[date]`
- [ ] GPT-safe `chat_session` formatting
- [ ] Homepage logic for journal entry status
