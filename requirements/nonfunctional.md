
### 🧑‍💻 **System Architecture**

* The backend will use **Hono**, and the frontend will use **Next.js**
* The database will be Postgres. Use Drizzle for ORM.
* NextJS target will be static site generation
* The entire system will feature end to end type safety. Hono will export a tRPC client. NextJS will use this client for calls.
* All API responses and requests must follow **JSON standards** with clear status codes.
* All backend functions should be **single-purpose** and easy to test or replace.
* **UUIDv4** will be used for all unique identifiers.
* All date/time fields must be **timezone-aware** (Postgres datetimez type).
* Use **environment-based config** for secrets, ports, URLs, etc.

### 🔐 **User Authentication**

* Users must be able to **register, log in, log out**, and manage their session securely.
* Auth will use **token-based authentication** (e.g., JWT or session cookies).
* All protected routes must validate auth tokens or sessions.
* Passwords must be securely hashed (e.g., bcrypt or argon2).

### 🎨 **Theming & UX**

* The app will support **light and dark themes** with a user toggle.
* OPTIONAL: Additional themes. IE, "dracula" theme, via DaisyUI
* UI should be **mobile-first**, responsive, and accessible (ARIA tags, keyboard nav, etc.).
* Loading states, empty states, and errors must be clearly communicated to users.

### 🧪 **Maintainability**

* Code should follow **industry best practices** (linting, formatting, commit hygiene).
* Separate concerns cleanly between frontend, backend, and data layers.
* Use **automated tests** for key logic (at least unit tests for backend functions).
