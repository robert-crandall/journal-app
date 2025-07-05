---
description: Guidelines for creating and maintaining VS Code rules to ensure consistency and effectiveness.
applyTo: '.github/instructions/*.md'
alwaysApply: true
---

- **Required Rule Structure:**

  ```markdown
  ---
  description: Clear, one-line description of what the rule enforces
  globs: path/to/files/*.ext, other/path/**/*
  alwaysApply: boolean
  ---

  - **Main Points in Bold**
    - Sub-points with details
    - Journals and explanations
  ```

- **File References:**
  - Use `[filename](mdc:path/to/file)` ([filename](mdc:filename)) to reference files
  - Journal: [prisma.md](.github/instructions/prisma.md) for rule references
  - Journal: [schema.prisma](mdc:prisma/schema.prisma) for code references

- **Code Journals:**
  - Use language-specific code blocks

  ```typescript
  // ✅ DO: Show good journals
  const goodJournal = true;

  // ❌ DON'T: Show anti-patterns
  const badJournal = false;
  ```

- **Rule Content Guidelines:**
  - Start with high-level overview
  - Include specific, actionable requirements
  - Show journals of correct implementation
  - Reference existing code when possible
  - Keep rules DRY by referencing other rules

- **Rule Maintenance:**
  - Update rules when new patterns emerge
  - Add journals from actual codebase
  - Remove outdated patterns
  - Cross-reference related rules

- **Best Practices:**
  - Use bullet points for clarity
  - Keep descriptions concise
  - Include both DO and DON'T journals
  - Reference actual code over theoretical journals
  - Use consistent formatting across rules
