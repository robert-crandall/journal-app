---
mode: agent
tools: [file_search, read_file, create_file, insert_edit_into_file]
description: Create a new SvelteKit component following best practices
---

# Create SvelteKit Component

Create a new SvelteKit component based on the following requirements:

Component name: ${input:componentName:MyComponent}
Description: ${input:description:A reusable component}
Props: ${input:props:title: string, onClick: () => void}

Create this component following our SvelteKit and Tailwind CSS best practices.
Reference: [SvelteKit Instructions](../../.github/instructions/sveltekit.instructions.md)
Reference: [TailwindCSS Instructions](../../.github/instructions/tailwindcss.instructions.md)
