# ESLint No-Emoji Rule

This ESLint rule prevents the use of emoji characters in your code and enforces the UI design guideline:

> Never use emojis in production UI - they're inconsistent across platforms.

## What This Rule Checks

The rule scans all text in your codebase for emoji characters:

- String literals: `"Hello 😊"`
- Template literals: `` `Welcome 🎉` ``
- Comments: `// This is a comment with emoji 👍`

## Why Use This Rule

Emojis may render differently across platforms and operating systems, which can lead to inconsistent user experiences or even miscommunication. Instead of emojis, use Lucide icons for consistent, accessible UI elements.

## How to Fix Violations

When the linter detects an emoji, replace it with:

1. A descriptive text alternative
2. A Lucide icon component:

```svelte
<!-- Instead of "Welcome! 🎉" -->
<div>
  Welcome! <PartyPopper class="h-4 w-4 inline text-accent" />
</div>
```

## Rule Configuration

The rule is configured in `eslint.config.js` with default severity level `error`:

```javascript
'no-emoji/no-emoji': 'error'
```

You can change the severity to `warn` if you prefer less strict enforcement during development.
