## ✨ Guiding Values

### 1. **Clarity Over Cleverness**

* Write code that explains itself.
* Prioritize readability over optimization unless proven necessary.
* Use descriptive naming for files, variables, and functions.

### 2. **Explicit > Implicit**

* Avoid magic. Prefer code where dependencies and behaviors are visible and understandable.
* Be clear about data flows, return values, and side effects.

### 3. **Single Responsibility**

* Functions, files, and modules should each do one thing well.
* Avoid bloated utilities or overloaded controllers.

### 4. **Separation of Concerns**

* Organize by layer: routing, controllers, services, models.
* Keep business logic out of routes.
* Abstract database queries behind service or model layers.

### 5. **Predictability Is Kind**

* Build APIs that behave consistently across all endpoints.
* Follow conventions: REST or RPC patterns, standard naming, familiar error handling.
* Use meaningful HTTP status codes and standardize error shapes.

### 6. **Low Coupling, High Cohesion**

* Modules should do one thing well and expose simple interfaces.
* Avoid tight dependencies between unrelated components.

### 7. **Be Replaceable**

* Any module should be swappable with minimal refactor.
* Think in terms of contracts and interfaces, not implementation.

---

## 🧱 Code Organization

### ✅ Recommended Patterns

* Group by domain, then layer (e.g., `auth/controller`, `auth/service`, `auth/model`)
* Route files should be thin; push logic down to services
* Validation belongs close to the edge (route or controller layer)
* Database logic belongs in services or models only

### ❌ Avoid

* Logic in route files
* DB queries scattered throughout codebase
* Over-reliance on global state or context

---

## 🧪 Testing and Observability

* All business logic should be unit-testable
* Favor pure functions where possible
* Use clear logging for unexpected paths and edge cases

---

## 🛠 Extensibility and Simplicity

* Default to simple solutions that can evolve over time
* Avoid pre-optimization or speculative abstraction
* Build scaffolding with future humans in mind — including yourself

---

## 🧩 Design for Real Teams

* Code should support onboarding: low cognitive load, clear entry points
* Favor traceability: "What happens when X?" should be answerable quickly
* Be kind to future maintainers: document the why, not just the how
