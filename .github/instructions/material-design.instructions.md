---
description: Desktop-first Material Design 3 with DaisyUI - project-specific patterns
applyTo: '**/*.{js,ts,svelte}'
---

# Material Design Implementation

## Overview

This project uses Svelte 5 with DaisyUI for a clean, efficient Material Design 3 implementation. The focus is on desktop-first design patterns that align with INTJ user preferences for minimalism and functionality.

## Target User

INTJ user - clean, efficient interfaces. Avoid flashy elements.

## Key Rules

- **DON'T** center narrow forms on wide screens - use full width
- **DO** use contextual sidebars for tips and live previews
- **DON'T** add redundant labels when title + helper text suffice

## UI/Design Guidelines

- Use color description (ie, primary) instead of color names (blue), to support easy theming.
- Use daisyUI for color and theme management. [DaisyUI Documentation](https://daisyui.com/llms.txt)
- Use Lucide Icons (https://lucide.dev) for all icon needs.
- Never use emojis in production UI - they're inconsistent across platforms.
- Choose semantic icon names that clearly represent their function.
- Use consistent icon sizes throughout the application (typically 16px, 20px, 24px).
- Use modals sparingly. These are good for quick actions. They are not good for complex forms or workflows.
- Create new pages for edit or new actions instead of using modals or in-line editing.
- Use confirmation dialogs for destructive actions only.
- Cards should be linked to their detail view like mobile apps. Do not include a "view" link or button inside the card.

## Target Browsers

- Use responsive design techniques to ensure a good experience on all devices.
- Both desktop and mobile should follow Material Design 3 principles.
- Optimize for PWA (Progressive Web App) standards.
- Use a navigation bar that is accessible and easy to use on both desktop and mobile.
