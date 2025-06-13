# 🧭 Full-Stack Next.js Style Guide

---

## 🗂️ Project Structure

```
/app/                // App Router pages and layouts
  /api/              // API routes (backend logic)
  /dashboard/        // Example UI routes
/lib/                // Reusable business logic (pure functions)
/components/         // Reusable UI components
/types/              // TypeScript types
/utils/              // General helpers, formatters, validators
/styles/             // Global styles, themes, variables
/db/                 // Drizzle ORM schema, queries, migrations
/middleware.ts       // Auth or request-level middleware
.env                 // Environment variables
```

---

## 📐 Code Organization Principles

* ✅ **Single-responsibility**: One file = one purpose
* ✅ **Keep logic out of components**: Use `lib/` for business rules
* ✅ **No magic**: Be explicit in API calls, state updates, and GPT interactions
* ✅ **Top-down clarity**: Exports at the top, helpers at the bottom
* ✅ **Colocate if small**, separate if complex (e.g., `component.tsx` + `component.css`)

---

## 🧑‍💻 TypeScript

* ✅ Use `as const` and literal types where possible
* ✅ Always define types/interfaces in `/types/`
* ✅ Prefer `type` for objects and `interface` for components
* ✅ Use explicit return types for public functions and API handlers

```ts
// ✅ Good
export async function getJournalEntry(id: string): Promise<JournalEntry> {
  ...
}
```

---

## 🔁 API Routes (`/app/api`)

* ✅ Always return structured JSON:

```ts
return NextResponse.json({ success: true, data: ... });
```

* ❌ Never mix business logic in API handlers — delegate to `/lib/`

* ✅ Handle and log all errors:

```ts
try { ... } catch (err) {
  console.error("Error in /api/journal", err);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}
```

---

## 🎨 Components

* ✅ Keep components **pure and focused**
* ✅ Use **Tailwind CSS** or `module.css` for styling
* ✅ Use meaningful names: `JournalSummaryCard`, not `Card3`
* ✅ Components go in `/components`, but group by type when scaling:

  * `/components/form/`
  * `/components/stats/`

---

## 🧪 Testing & Debugging

* ✅ Console log clearly and consistently during development
* ✅ Include timestamps or context:

```ts
console.log("[GPT-GenerateSummary]", { entryId, summary });
```

* ✅ Use browser network tab to inspect API calls
* ✅ Catch and display all fetch errors in UI

---

## 🌐 Database & Drizzle ORM

* ✅ Define schemas in `/db/schema.ts`
* ✅ Separate queries and mutations into `/db/queries.ts` and `/db/mutations.ts`
* ✅ Use UUIDv4 for all primary keys
* ✅ Use `timestamptz` in UTC for all date fields
* ✅ Never put DB logic directly in API handlers

---

## 🔐 Auth

* ✅ Auth must wrap every sensitive route and API
* ✅ Use middleware for route protection
* ✅ Keep the logged-in user context in a clean helper:

```ts
export async function getUserFromRequest(req: NextRequest): Promise<User | null>
```

---

## 🛠️ General Conventions

| Concept         | Convention                                                    |
| --------------- | ------------------------------------------------------------- |
| File naming     | `camelCase` for files, `PascalCase` for components            |
| Variable naming | Clear, unambiguous (e.g. `userId`, `entryText`)               |
| Date handling   | Use `Date.toISOString()` in UTC; convert to local in frontend |
| IDs             | `uuidv4()` only (no auto-increment)                           |
| GPT usage       | Abstract into `lib/gpt.ts`, always log input/output in dev    |

---

## ✨ Optional Extras

* Add **Storybook** for reusable components
* Use **Zod** for schema validation in API routes
* Add **Prettier + ESLint** for formatting and linting consistency
