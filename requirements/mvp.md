# 🧪 MVP Requirements – Life Quest App

This document defines the Minimum Viable Product (MVP) for the **Life Quest App**, a personal growth system powered by GPT and inspired by role-playing mechanics. The app is designed for solo use and will help users define long-term goals, develop weekly rhythms, and level up character stats through task completion and journaling.

---

## 🧰 Tech Stack

- **Backend:** Hono (in `backend/`)
- **Frontend:** SvelteKit 2 (in `frontend/`)
- **Styling:** Tailwind CSS (with DaisyUI)
- **Database:** PostgreSQL
- **ORM:** Drizzle

---

## 📁 Project Structure

```
/backend            → API, models, and DB logic
/frontend           → UI and SvelteKit routes
```

---

## 🔐 Authentication

- Basic auth with email and password
- Store sessions via secure HTTP-only cookies
- Only one user is expected (you), but auth is still required for exposing the app to the internet (e.g. for PWA notifications)

---

## 👤 User Model

- A `User` represents the primary logged-in person
- `User` can:
  - Store GPT context info (e.g. preferences, history)
  - Define long-term goals (Focuses)
  - Log journal entries
  - Interact with tasks and levels

---

## 👪 Family Members

- Stored in the same table as `User`, with a `type` or `isFamily` flag to distinguish
- Do not have login credentials
- Share many capabilities with users (e.g. attributes, task history)
- Used to model interactions like "Play music with Ian"

---

## 🧬 Attributes

- Stored in a separate `Attribute` table
- Key-value model:
  - Example: `{ key: "value", value: "honesty" }`
- Shared by both Users and Family Members via polymorphic or flexible foreign key
- Supports: values, interests, strengths, quirks, etc.

---

## 🎯 Focus & Levels

- A `Focus` is a user-defined category of personal development (e.g. "Creative Fire", "Strength")
  - Includes: name, description, GPT-enabled context
- A `Level` is a trackable counter within a Focus (e.g. "Strength Level 3")
  - Incremented when relevant tasks are completed
  - Levels are user-defined and link to a Focus

---

## ✅ Tasks

- `Task` has:
  - title, description, due date, associated focus/level
  - origin (user-defined, GPT-generated, system-defined)
  - optional `family_member_id` link
  - optional completion record
- Repeats or scheduling not needed yet
- Completion should store:
  - Result summary (used for GPT reflection)
  - Timestamp

---

## 🧾 Journaling

- User can create daily journal entries
- GPT will:
  - Ask follow-up questions in the UI
  - Summarize final journal into short text blob
  - Extract tags (e.g. “energy”, “connection”, “success”)
  - Record link between journal and tasks/focuses (optional)

---

## 📈 A/B Testing

- Users can experiment with behavior (e.g. “Take protein powder daily”)
- These are called "Potions"
- A Potion includes:
  - Title
  - Hypothesis or intended outcome
  - Start/end date
  - Optional task linkage
  - GPT will analyze journals and task outcomes to infer whether the potion helped

---

## 🧩 Relations & Linking

- `User` ↔ `Family` share table with user type
- `Attribute` links to `user_id` or `family_id`
- `Task` links to:
  - `focus_id` (optional)
  - `level_id` (optional)
  - `family_id` (optional)
  - `completed_at`, `summary`
- `Journal` has:
  - `user_id`
  - GPT-derived tags and summary

---

## 🛠 MVP Features Summary

- [ ] User registration and login
- [ ] Create/update/delete family members
- [ ] Assign and track attributes
- [ ] Define focuses and levels
- [ ] Create, complete, and reflect on tasks
- [ ] Journal entries with GPT summary
- [ ] Create and track potions
- [ ] Minimal UI for dashboard, forms, and task flows

Let me know if you want this broken into user stories, GitHub issues, or schema drafts!
