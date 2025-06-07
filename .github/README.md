# GitHub Copilot Configuration

This directory contains the GitHub Copilot instruction files for the Journal App project.

## File Structure

### Core Instructions
- **`copilot-instructions.md`** - Main workspace instructions applied to all code generation
- **`instructions/`** - Directory containing specific instruction files for different contexts

### Instruction Files
- **`sveltekit.instructions.md`** - Guidelines for SvelteKit components and frontend development
- **`hono.instructions.md`** - Guidelines for Hono backend API development  
- **`tailwindcss.instructions.md`** - Guidelines for Tailwind CSS 4 styling
- **`daisyui.instructions.md`** - Guidelines for daisyUI 5 component usage

### Reference Documentation
- **`references/`** - Original detailed documentation files for reference

## How It Works

1. **Global Instructions**: The `copilot-instructions.md` file contains project-wide coding standards and architecture guidelines that apply to all code generation.

2. **Contextual Instructions**: Files in the `instructions/` directory use the `applyTo` front matter to automatically apply specific guidelines based on file patterns:
   - Frontend files (`**/*.svelte`) get SvelteKit and styling guidelines
   - Backend files (`backend/**/*.ts`) get Hono API guidelines
   - Task-related files get GPT task system guidelines

3. **Detailed References**: The `references/` directory contains the complete technical documentation for each technology, which the instruction files reference for detailed API information.

## VS Code Settings

To enable these instruction files, ensure these settings are configured:

```json
{
  "github.copilot.chat.codeGeneration.useInstructionFiles": true,
  "chat.promptFiles": true
}
```

## Usage

The instruction files are automatically applied by GitHub Copilot when generating code. You can also manually reference them in chat by using:

- `@workspace` to include workspace context
- Mentioning specific files when you need detailed guidance

## Maintenance

- Update instruction files when coding standards change
- Keep reference documentation up to date with library versions
- Test instruction effectiveness with actual code generation scenarios
