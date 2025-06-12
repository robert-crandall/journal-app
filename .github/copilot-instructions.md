# Journal App - Copilot Instructions

## Project Overview
This is a personal journaling application designed to help users reflect on their daily experiences and track personal growth through structured self-experiments. The app features a conversational journal powered by GPT, allowing users to gain insights from their entries, and integrates with self-experiments that encourage lifestyle changes.

## General Coding Standards

### Core Principles
- **Clarity Over Cleverness**: Write self-explanatory code, prioritize readability
- **Explicit > Implicit**: Make dependencies and behaviors visible, avoid magic
- **Single Responsibility**: Functions and modules should do one thing well
- **Separation of Concerns**: Organize by layer (routing, services, models)
- **Predictability**: Build consistent APIs with standard patterns
- **Low Coupling, High Cohesion**: Simple interfaces, avoid tight dependencies
- **Be Replaceable**: Design modules that can be swapped with minimal refactor

### Code Style
- Use TypeScript for all new code
- Follow functional programming principles where possible
- Use meaningful variable and function names
- Add comments for complex business logic
- Prefer immutable data patterns
- Default to simple solutions that can evolve over time

## Project-Specific Guidelines

### Frontend Development
- Use SvelteKit's file-based routing
- Leverage Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Follow component composition patterns

### Styling
- Use Tailwind CSS 4 utilities for styling
- Leverage daisyUI 5 components when appropriate
- Follow mobile-first responsive design
- Maintain consistent spacing and typography

## Instruction files

- Use `.github/instructions/` for project-specific guidelines
