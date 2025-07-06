# Copilot Instructions Repository

This repository serves as an example of using Copilot Instructions files. It shows an example application, that allows user registration and login. This is done with a split backend/frontend architecture.

All documentation for the technology stack is in `.github/instructions/*`, with references to full documentation at `.github/references/*`

## Structure

- `.github/copilot-instructions.md`: Main instructions file that applies globally.
- `.github/instructions/`: Folder for specific technology or task instructions.
- `.github/references/`: Folder for comprehensive documentation references that support the instruction files.

## Agentic weaknesses

This template tries to address several Agentic coding weaknesses:

1. Inconsistencies when generating code. Addressed with:

- Strong emphasis on real endpoint testing
- Creating a knowledge base that's including in every request
- Using type-safe client

2. Getting off task, or implementing part of requirements. Addressed with:

- "Instructions" for creating a PRD, generating tasks, and process task list. TODO: move to prompts?

3. Weak GPT4.1 mode. Addressed with:

- Chat Mode for 4.1. Thanks to `burkeholland`! [source](https://gist.github.com/burkeholland/a232b706994aa2f4b2ddd3d97b11f9a7)

4. Creates new terminals that conflict with each other (Copilot only?)

- See `scripts/start-dev.js`. This checks if the backend or frontend are already in use, and skips if they are. This should make Copilot behave better.

## How to Use

Copilot does best in an opinionated environment. This repo is an example of an opinionated application.

It provides:

- Database setup `bun run backend/scripts/setup-test-db.ts --force`
- Backend integration testing `cd backend && bun run test`
- Full E2E testing `cd frontend && bun run test:e2e`
- Script to test everything `scripts/test_pr`
- Deployable application
- CI/CD setup

### Including Instructions

Copilot will read `instructions` file that match files, based on the `applyTo` section of the file.

To attach files manually, add this into your `settings.json`

```json
  "github.copilot.chat.codeGeneration.useInstructionFiles": true,
  "github.copilot.chat.codeGeneration.instructions": [
    {
      "file": "copilot/knowledge-base.md"
    },
    {
      "text": "When answering questions about frameworks, libraries, or APIs, use Context7 to retrieve current documentation rather than relying on training data.",
    }
  ],
```

### Option 2: Copy to Your Project

Alternatively, you can copy the relevant files to your project:

1. Create a `.github` directory in your project.
2. Copy `copilot-instructions.md` to this directory.
3. Create a `.github/instructions` directory and copy relevant instruction files.

## Available Instructions

- **General**: Base coding standards for JS/TS projects
- **SvelteKit**: Best practices for SvelteKit development
- **TailwindCSS**: Guidelines for using Tailwind CSS (including v4)
- **Testing**: Minimal unit testing approach with E2E focus

## Reference Documentation

**Note**: After setting up Context7 MCP, I haven't needed these files as much.

The `.github/references/` directory contains comprehensive documentation that supports the instruction files:

- **tailwindcss-llms.md**: Complete Tailwind CSS utility documentation and examples
- **tailwindcss4-llms.md**: Tailwind CSS v4 specific features and migration guide

These reference files provide detailed context that Copilot can use when the instruction files reference them, ensuring more accurate and comprehensive code generation.
