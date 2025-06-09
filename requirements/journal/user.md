# 🔐 User Authentication – Backend Requirements

This document outlines the requirements for implementing user registration, login, and authentication using **JWT**. The system supports a single-user application exposed to the public for future PWA support.

---

## 📁 Folder Structure

```
/backend/
  routes/
    auth/
      register.ts
      login.ts
      me.ts
  lib/
    auth.ts         ← JWT utilities
    users.ts        ← User creation/fetch helpers
  db/
    schema.ts       ← Drizzle schema for users
```

---

## 🧑‍💼 Database: `users` Table

Use Drizzle with PostgreSQL.

```ts
users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})
```

---

## 🔐 JWT Auth (in `lib/auth.ts`)

### 🔧 Responsibilities:

* `signJwt(userId: string): string`
* `verifyJwt(token: string): string | null` → returns user ID if valid
* `getUserFromRequest(req: Request): User | null`

### 🔑 Requirements:

* Use a secure, secret JWT key from `AUTH_SECRET`
* JWT should expire in 30 days
* All protected routes must check for a valid token in `Authorization: Bearer <token>`

---

## 🧾 API Endpoints

### `POST /auth/register`

* Accepts `{ email, password }`
* Validates email format and password length (min 8 characters)
* Hashes password with `bcrypt`
* Returns JWT token and user object

### `POST /auth/login`

* Accepts `{ email, password }`
* Validates password against stored hash
* Returns JWT token and user object

### `GET /auth/me`

* Requires Bearer token
* Returns current user object

---

## ✅ Password Handling

* Use **bcrypt** to hash and compare passwords
* Store only the hashed value
* Use `bcrypt.compare()` for login
