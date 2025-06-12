## ⚙️ Non-Functional Requirements (Multi-User, API-First SvelteKit)

### 🏗️ System Architecture

* The app is built using **SvelteKit** in a **full-stack, API-first architecture**:

  * **API routes** live under `/routes/api/**/+server.ts`
  * **Frontend** communicates with backend via `fetch()` to these endpoints
  * Core business logic is isolated in `/lib/` and reused by both frontend and backend

### 🗃️ Database & ORM

* Use **PostgreSQL** for persistent data storage
* Use **Drizzle ORM** for type-safe schema definitions and queries
* All tables will use **UUIDv4** as primary keys
* Use `TIMESTAMPTZ` for all date/time fields (stored in UTC)
* Every data model (journal entries, quests, tasks, stats) will be **scoped to a user_id**

### 🛠️ CRUD Requirements

Everything listed — journal entries, tags, experiments, tasks, and character stats — must support:

* **Create** (add a new entry)
* **Read** (view or filter/search existing items)
* **Update** (edit past entries or definitions)
* **Delete** (remove if needed, with smart rules, like not deleting linked journals)

### 🔐 Multi-User Support & Authentication

* Users can **register**, **log in**, and **manage sessions**
* Each user will only be able to access **their own data** (enforced at both API and DB layers)
* Use **secure password hashing** (e.g., bcrypt or argon2)
* Use **session-based authentication** (e.g., cookie sessions) or JWT depending on deployment target
* Auth middleware will guard API routes and page access
* Email must be unique per user

### 🧑‍💻 Code Maintainability & Dev UX

* All logic must follow the **Single Responsibility Principle**
* Keep data validation, business logic, and request handling separated
* Use TypeScript with a shared `/types` directory
* API responses must return:

  * Proper status codes (`200`, `401`, `422`, etc.)
  * Helpful error messages for frontend debugging
* Include dev logging (`console.error`, `console.log`) on both frontend and server

### 🎨 UX/UI

* Fully **responsive**, **mobile-first** design
* Support **light/dark mode toggle**
* OPTIONAL: Support themes - aka "dracula" theme
* UX will follow accessibility standards (e.g., ARIA, keyboard nav)
* All actions (task check-off, journal save, GPT processing) must include:

  * Clear loading indicators
  * Success/failure feedback

### 🧪 Testing & Debuggability

* Backend logic will be testable in isolation (`lib/` functions pure where possible)
* API routes should be testable via Postman or browser devtools (fetch/response visibility)

### 🛠️ Deployment & Config

* Use `.env` for secrets and environment config
* Handle all time data in UTC; convert to user’s local time on frontend
* Date calculations, like `beginning_of_day`, are user's local time
* Set up proper error handling (`handleError`, logging middleware, etc.)
