## 🎯 Core UX Values

- **Responsiveness with subtle animation**: Prioritize immediate state feedback, but allow gentle transitions that reinforce flow.
- **Emotionally neutral tone**: Avoid overly cheery prompts or gamified rewards. Favor sincere, affirming language.
- **Structured clarity**: Favor clarity over cleverness. Reduce clutter, but don't eliminate warmth.
- **Depth-friendly scaffolding**: Build for meaningful use — systems that can grow more useful over time.

---

## ⚙️ Interaction Rules

### ✅ Must-Haves
- Progress bars, checkboxes, toggles **must update instantly**
- GPT or API responses should update **state clearly**, without requiring manual refresh
- Forms and submissions should reflect status (e.g. “Saved”, “Updated”) with optional subtle animation or micro-feedback

### ⚠️ Cautious Use
- Use animations sparingly and purposefully — for orientation, transitions, or state change, not delight
- Avoid emotionally exaggerated phrases (“You crushed it!”), but affirm progress (“+1 XP in Strength”)

---

## 🎨 Visual Design

### Theme
- Support both dark and light modes
- Consistent themes are good
- Use of color is good. Using box headings, or rounded single-border, is good.

### Layout
- Grid-based layout with generous spacing and clean structure
- Sticky headers or navs where helpful
- Prefer subtle borders, shadows, or color contrast to indicate separation

### Typography
- Use clean, readable fonts
- Vary font weight/size for hierarchy
- Emoji or icons should support meaning — not replace it

### Interaction
- Elements should be interactive, "app like"
- The largest container possible should be clickable. Do not hide a "view this" link when clicking a div makes sense.

---

## 🔁 Refresh Patterns

- Reflect state changes immediately (optimistic updates encouraged)
- Use stores or signals to sync state between components
- Prefer auto-saving to "Save to apply" patterns

---

## 🔗 Use With
- SvelteKit / React / Tailwind / DaisyUI / ShadCN
- Any GPT-enhanced interaction (journaling, reflection, task generation)
- Any app that prioritizes internal self-trust or structured reflection

---

## ✅ Summary for Reuse

- [x] Instant, visible feedback with optional subtle animation
- [x] Respectful, emotionally grounded tone
- [x] Clear visual hierarchy with thoughtful spacing
- [x] Self-evident UI state
- [x] Subtle reinforcement of progress and growth

This UX profile should apply across your coaching tools, trackers, PWA experiments, and introspective productivity apps.
