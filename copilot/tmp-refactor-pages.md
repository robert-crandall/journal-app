# How to Refactor a Page for AppHeader + PageContainer

- [ ] Step 1: Remove any custom header markup (titles, subtitles, icons, badges, etc.) at the top of the page.
- [ ] Step 2: Import the shared AppHeader component and a suitable Lucide icon for the header (e.g., `import { BookOpenIcon } from 'lucide-svelte';`).
- [ ] Step 3: Add the AppHeader at the top of your main content, passing:
  - `title` (string)
  - `subtitle` (string)
  - `icon` (icon component, e.g., `icon={BookOpenIcon}`)
  - `buttons` (optional, for header actions)
- [ ] Step 4: Import the PageContainer component and wrap all main page content (including AppHeader) in `<PageContainer>...</PageContainer>`.
- [ ] Step 5: Remove any existing container divs with `max-w-7xl`, `mx-auto`, `px-4`, or `py-8` from the page. The PageContainer handles all of this.
- [ ] Step 6: Delete any `max-w-7xl`, `mx-auto`, `px-4`, or `py-8` classes from inner divs or `<main>` tags that are now inside PageContainer.
- [ ] Step 7: Keep only the PageContainer as the layout wrapper for the main content.
- [ ] Step 8: Test that the header and content are centered and have the correct max width and padding. Verify that the header looks consistent with other pages.
