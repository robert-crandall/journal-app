### 📘 Feature: Journal Dashboard

**Goal:**
Provide users with an intuitive, filterable interface to browse and reflect on their past journal entries. Help surface meaningful patterns in mood, growth, and themes over time.

---

### 🧱 Core Features

#### 🗂 Entry Listing

- [ ] List all journal entries (most recent first)
- [ ] Show for each entry:
  - Date (`YYYY-MM-DD`)
  - Title
  - Synopsis (if present)
  - Tags: content, tone, stat
  - Status badge (e.g. Draft, In Review, Complete)

#### 🔍 Filters

- [ ] **By keyword** (search title, synopsis, and initial message)
- [ ] **By date range** (e.g., show entries from last month)
- [ ] **By tags**:
  - [ ] Content tags
  - [ ] Family tags
  - [ ] Stat tags

#### 📅 Summary View

- [ ] Show a **calendar heatmap** or **timeline** to visualize:
  - Days with entries
  - Days missing entries (optional prompt to "fill in the gaps")

- [ ] Allow click-to-view from this view

---

### 🖥️ UI/UX Notes

- `/journal` route
- Tag filter options should be generated from existing tag data (not hardcoded)
- Each entry in the list links to `/journal/[date]`
- Consider sticky filters on sidebar or collapsible panel
- Option to "Start New Entry" for today if none exists

---

### 🧠 Smart Features (Optional but Valuable)

- [ ] Group similar entries by tone or stat for user insight
- [ ] Highlight entries with unusually high XP or lots of tags

---

### ✅ Acceptance Criteria

- [ ] View all journal entries with key metadata
- [ ] Filter by keyword, date, and tags
- [ ] Link each entry to its detailed page
- [ ] Responsive design with mobile-friendly layout
