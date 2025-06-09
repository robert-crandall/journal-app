## 🧠 GPT Service Layer

To keep GPT logic clean, reusable, and testable, implement a **single GPT service module** that abstracts OpenAI API usage. All GPT calls (e.g., message follow-ups, journal compilation, metadata extraction) go through this module.

### 📄 `lib/gpt.ts` (or `utils/gpt.ts`)

**Responsibilities:**

* Reads `OPENAI_API_KEY` from environment
* Accepts structured input: messages, system prompt, temperature, etc.
* Handles OpenAI API call and returns parsed result

**Benefits:**

* Keeps GPT logic centralized
* Allows consistent logging and error handling
* Avoids environment key exposure elsewhere in code

### ✅ Example Usage

```ts
import { callGPT } from "@/lib/gpt"

const result = await callGPT({
  messages: [{ role: "user", content: "How was my day?" }],
  system: "You are a gentle reflection assistant...",
  temperature: 0.7,
})
```

### 🔐 `OPENAI_API_KEY` only loaded in `gpt.ts`

* No other file should import or access `Bun.env.get("OPENAI_API_KEY")`
* Use dependency injection if mocking/testing is needed later
