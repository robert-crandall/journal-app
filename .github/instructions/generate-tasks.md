# Rule: Generating a Task List from a PRD

## Goal

To guide an AI assistant in creating a detailed, step-by-step task list in Markdown format based on an existing Product Requirements Document (PRD). The task list should guide a developer through implementation.

## Output

- **Format:** Markdown (`.md`)
- **Location:** `/copilot/`
- **Filename:** `tasks-[prd-file-name].md` (e.g., `tasks-prd-user-profile-editing.md`)

## Process

1.  **Receive PRD Reference:** The user points the AI to a specific PRD file
2.  **Analyze PRD:** The AI reads and analyzes the functional requirements, user stories, and other sections of the specified PRD.
3.  **Phase 1: Generate Parent Features:** Based on the PRD analysis, create the file and generate the main, high-level features required to implement the requirements. Use **scrum** type project management. That is, each parent feature is a **feature** that are usable and contain integration tests (backend) and end to end tests (frontend). 
 - **Do not** use waterfall - **do not** designate "complete backend" as feature 1. A feature is "complete user registration", subtasks are "complete backend", "write backend integration tests", "complete frontend", "write frontend end to end tests", "ensure all tests pass". Use your judgement on how many high-level features to use, there is no limit. 
 - Present these features to the user in the specified format (without sub-tasks yet). Inform the user: "I have generated the high-level features based on the PRD. Ready to generate the sub-tasks? Respond with 'Go' to proceed."
4.  **Wait for Confirmation:** Pause and wait for the user to respond with "Go".
5.  **Phase 2: Generate Sub-Tasks:** Once the user confirms, break down each parent feature into smaller, actionable sub-tasks necessary to complete the parent feature. Ensure sub-tasks logically follow from the parent feature and cover the implementation details implied by the PRD.
7.  **Generate Final Output:** Combine the parent features, sub-tasks, relevant files, and notes into the final Markdown structure.
8.  **Save Task List:** Save the generated document in the `/copilot/` directory with the filename `tasks-[prd-file-name].md`, where `[prd-file-name]` matches the base name of the input PRD file (e.g., if the input was `prd-user-profile-editing.md`, the output is `tasks-prd-user-profile-editing.md`).

## Output Format

The generated feature list _must_ follow this structure:

```markdown
## Features

- [ ] 1.0 Parent Feature Title
  - [ ] 1.1 [Sub-task description 1.1]
  - [ ] 1.2 [Sub-task description 1.2]
- [ ] 2.0 Parent Feature Title
  - [ ] 2.1 [Sub-task description 2.1]
- [ ] 3.0 Parent Feature Title (may not require sub-tasks if purely structural or configuration)
```

## Interaction Model

The process explicitly requires a pause after generating parent features to get user confirmation ("Go") before proceeding to generate the detailed sub-tasks. This ensures the high-level plan aligns with user expectations before diving into details.

## Target Audience

Assume the primary reader of the feature list is a **junior developer** who will implement the PRD.
