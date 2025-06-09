# 🛠️ Backend Requirements – Journal MVP

## 📁 Directory Structure

```
/backend/
  /routes/journal/
    - start.ts      // Start a journal session
    - reply.ts      // Add message to journal conversation
    - submit.ts     // Finalize + extract metadata
    - list.ts       // Fetch journal entries list
    - entry.ts      // Get/edit a specific journal entry
  /lib/gpt/
    - journalSummarizer.ts
    - metadataExtractor.ts
```

---

## 📦 Database Schema

### `journal_sessions`

| Field           | Type        | Description                       |
| --------------- | ----------- | --------------------------------- |
| id              | UUID (PK)   | Unique ID                         |
| user\_id        | UUID (FK)   | Linked to user                    |
| started\_at     | timestampz  | When journaling started           |
| submitted\_at   | timestampz? | When finalized                    |
| finalized\_text | text?       | GPT-written final journal entry   |
| title           | varchar?    | Human-readable title              |
| summary         | text?       | Condensed summary (1–2 sentences) |
| full\_summary   | text?       | Rewritten GPT version             |

---

### `journal_messages`

| Field       | Type       | Description               |
| ----------- | ---------- | ------------------------- |
| id          | UUID (PK)  | Unique ID                 |
| session\_id | UUID (FK)  | Linked to journal session |
| role        | enum       | `user` or `gpt`           |
| content     | text       | Message content           |
| created\_at | timestampz | Timestamp of message      |

---

### `journal_tags`

| Field | Type      | Description               |
| ----- | --------- | ------------------------- |
| id    | UUID (PK) | Unique ID                 |
| name  | varchar   | Tag name (must be unique) |

### `journal_entry_tags`

| Field       | Type      | Description                 |
| ----------- | --------- | --------------------------- |
| journal\_id | UUID (FK) | Linked to journal\_sessions |
| tag\_id     | UUID (FK) | Linked to journal\_tags     |

---

## 🧠 GPT Logic Modules

* `generateGPTResponse(sessionId: UUID) → string`

  * Takes user’s latest message, returns GPT follow-up question + light empathy
* `compileJournal(sessionId: UUID) → string`

  * Returns full, tone-matched journal entry written by GPT
* `extractMetadata(finalText: string) → { title, condensed, summary, tagNames[] }`

  * Returns:

    * Title
    * Condensed 1–2 sentence summary
    * Full summary
    * Tags (only uses existing ones unless no close match)

---

## 📡 API Endpoints

### `POST /api/journal/start`

* Creates new `journal_session`
* Returns `session_id`

---

### `POST /api/journal/reply`

* Body: `{ session_id, message }`
* Adds user message to conversation
* Calls GPT → responds with reply
* Saves GPT reply
* Returns latest messages

---

### `POST /api/journal/submit`

* Compiles final journal entry from conversation
* Runs metadata extraction
* Saves finalized text, title, summary, tags
* Returns updated journal object

---

### `GET /api/journal/list`

* Returns journal entries:

  * `id`, `title`, `condensed_summary`, `created_at`

---

### `GET /api/journal/:id`

* Returns:

  * Full journal entry
  * Metadata (title, summary, tags)
  * Conversation history

---

### `PATCH /api/journal/:id`

* Allows editing:

  * Title
  * Summary
  * Final text
  * Tags

---

Let me know if you want frontend requirements next or GitHub issues per feature!
