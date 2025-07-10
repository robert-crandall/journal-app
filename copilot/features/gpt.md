## 🧠 GPT Integration Architecture

You're building a rich, GPT-powered app where many features (journal, tasks, character stats, etc.) need to use the OpenAI API. Some of these calls will be **context-aware** (e.g., backstory, family), others will generate creative content (like tasks or reflections). Here's how to keep it flexible, organized, and scalable:

---

### 1. **Central GPT Configuration**

There should be a **single configuration module** that defines:

- The default OpenAI model (e.g., `gpt-4o`)
- The API key (read from environment variables)
- Optional toggles for debugging (e.g., log prompts/responses for dev)
- Retry settings or rate limiting in the future

But **temperature should not be set globally** — it will be specified by the individual caller, since journal tone extraction might use `0.2`, while creative task generation might use `0.9`.

---

### 2. **GPT Client Abstraction**

Use a centralized “client” or helper function to make GPT API calls. This ensures:

- Consistent handling of prompts and formatting
- Debugging and error handling are built-in
- Future upgrades (e.g., caching or streaming) can be added in one place

Each **GPT caller will use this shared client**, passing in:

- Its own **system prompt**
- The **user prompt or context**
- Any **extra metadata**, like temperature or role-based messages

---

### 3. **Per-Feature GPT Modules**

Each GPT use case (e.g. journal summarization, task generation, stat tag extraction) lives in its own file. These modules are **entry points** with their own:

- **System prompt**
- Logic to compose the full prompt from user/app context
- Control over temperature or model version
- Call to the shared client

Think of each as a “GPT strategy” tied to a domain concept.

Examples:

- `journal.ts` → GPT analysis of journal entries
- `taskGenerator.ts` → GPT-generated task suggestions
- `statNamer.ts` → GPT-generated humorous stat level titles
- `questTitleGenerator.ts` → GPT-generated quest names

---

### 4. **Shared GPT Utilities**

Some logic is reused across callers — e.g., generating summaries, titles, or XP estimates. These live in a **shared utilities folder** and are written as reusable GPT functions.

These shared utilities:

- Don't maintain their own system prompt
- Use prompts constructed by the calling module
- Are ideal for simple or composable tasks (e.g., `generateTitleFromText()`)

---

### 5. **Backstory as Input Context**

Your **"backstory"** is not something to generate — it's **context** provided to GPT when generating things like journal analysis or task ideas. It may include:

- Your DnD-style backstory (“You are a Ranger who thrives outdoors…”)
- Your goals and aspirations
- Information about your family and their preferences
- Your current focus for the day or week
- Recent interactions or events
- Any relevant project you're working on

These are bundled together by the **calling module**, not globally managed. For instance:

> “Given the user’s backstory, family dynamics, recent interactions, current goals, and weather, suggest 2 tasks — one solo and one with a child.”

Each GPT feature will determine what context is relevant and construct its own prompt accordingly.

---

### Summary Table

| Concern                       | Where It's Handled                                          |
| ----------------------------- | ----------------------------------------------------------- |
| API key, model, debug flag    | Central GPT config module                                   |
| Temperature & system prompt   | Caller-defined per GPT use case                             |
| GPT API call logic            | Central GPT client (abstracted for consistency & logging)   |
| Shared helper functions       | Reusable utility modules (e.g. XP calculators, tag mappers) |
| Domain-specific GPT logic     | Modular files per use case (`journal.ts`, `taskGen.ts`)     |
| User context (backstory, etc) | Passed dynamically by callers when generating prompts       |
