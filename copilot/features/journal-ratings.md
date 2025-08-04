### 🗓️ Feature: Journal Day Rating & Heatmap

**Description:**
Add a way for users to rate their day when completing a journal entry. This score will power a calendar-style heatmap on the journal dashboard, helping users visually identify trends in mood, performance, or overall well-being over time.

---

**Functionality:**

- [ ] Prompt user to rate the day (1–5) when submitting a journal marked `complete`
  - Option: emoji picker instead of numbers (e.g. 😞 😐 🙂 😄 🤩)
  - Store as `day_rating` on the journal entry (integer 1–5)

- [ ] Add a calendar-style heatmap to the journal dashboard
  - Red (1) → Green (5) gradient
  - Each square = one day
  - Tooltip shows date, score, and journal title
  - Clicking a day opens that journal

---

**Design Notes:**

- This feature should work with one journal per day model (e.g. `/journal/2025-07-17`)
- Heatmap should be responsive and clear on mobile/desktop
- Use of emoji picker should feel intuitive and quick
