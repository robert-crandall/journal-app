<script lang="ts">
  import { parseMarkdown } from '../utils/markdown';

  export let content: string = '';
  export let className: string = '';

  $: htmlContent = parseMarkdown(content);
</script>

<div class="markdown-content {className}">
  {@html htmlContent}
</div>

<style>
  .markdown-content {
    color: oklch(var(--bc) / 0.8); /* Base content with opacity */
  }

  .markdown-content :global(h1) {
    font-size: 1.5rem; /* text-2xl */
    font-weight: 700; /* font-bold */
    margin-bottom: 1rem; /* mb-4 */
    margin-top: 1.5rem; /* mt-6 */
    color: oklch(var(--bc)); /* Full opacity for headers */
  }

  .markdown-content :global(h1:first-child) {
    margin-top: 0;
  }

  .markdown-content :global(h2) {
    font-size: 1.25rem; /* text-xl */
    font-weight: 700; /* font-bold */
    margin-bottom: 0.75rem; /* mb-3 */
    margin-top: 1.25rem; /* mt-5 */
    color: oklch(var(--bc));
  }

  .markdown-content :global(h2:first-child) {
    margin-top: 0;
  }

  .markdown-content :global(h3) {
    font-size: 1.125rem; /* text-lg */
    font-weight: 700; /* font-bold */
    margin-bottom: 0.5rem; /* mb-2 */
    margin-top: 1rem; /* mt-4 */
    color: oklch(var(--bc));
  }

  .markdown-content :global(h3:first-child) {
    margin-top: 0;
  }

  .markdown-content :global(h4) {
    font-size: 1rem; /* text-base */
    font-weight: 700; /* font-bold */
    margin-bottom: 0.5rem; /* mb-2 */
    margin-top: 0.75rem; /* mt-3 */
    color: oklch(var(--bc));
  }

  .markdown-content :global(h4:first-child) {
    margin-top: 0;
  }

  .markdown-content :global(h5) {
    font-size: 0.875rem; /* text-sm */
    font-weight: 700; /* font-bold */
    margin-bottom: 0.25rem; /* mb-1 */
    margin-top: 0.5rem; /* mt-2 */
    color: oklch(var(--bc));
  }

  .markdown-content :global(h5:first-child) {
    margin-top: 0;
  }

  .markdown-content :global(h6) {
    font-size: 0.75rem; /* text-xs */
    font-weight: 700; /* font-bold */
    margin-bottom: 0.25rem; /* mb-1 */
    margin-top: 0.5rem; /* mt-2 */
    color: oklch(var(--bc));
  }

  .markdown-content :global(h6:first-child) {
    margin-top: 0;
  }

  .markdown-content :global(p) {
    margin-bottom: 1rem; /* mb-4 */
    line-height: 1.625; /* leading-relaxed */
  }

  .markdown-content :global(ul) {
    list-style-type: disc;
    list-style-position: inside;
    margin-bottom: 1rem; /* mb-4 */
    padding-left: 1rem; /* Better indentation */
  }

  .markdown-content :global(ul li) {
    margin-bottom: 0.25rem; /* space-y-1 */
    list-style-position: outside; /* Better bullet positioning */
  }

  .markdown-content :global(ol) {
    list-style-type: decimal;
    list-style-position: inside;
    margin-bottom: 1rem; /* mb-4 */
    padding-left: 1rem; /* Better indentation */
  }

  .markdown-content :global(ol li) {
    margin-bottom: 0.25rem; /* space-y-1 */
    list-style-position: outside; /* Better number positioning */
  }

  .markdown-content :global(li) {
    line-height: 1.625; /* leading-relaxed */
  }

  .markdown-content :global(blockquote) {
    border-left: 4px solid;
    border-color: oklch(var(--p) / 0.3); /* Primary color with opacity */
    padding: 1rem;
    font-style: italic;
    margin-bottom: 1rem; /* mb-4 */
    background-color: oklch(var(--b2)); /* Secondary background */
    border-radius: 0.25rem;
  }

  .markdown-content :global(code) {
    background-color: oklch(var(--b2)); /* Secondary background */
    color: oklch(var(--ac)); /* Accent color for inline code */
    padding: 0.125rem 0.375rem; /* px-1.5 py-0.5 */
    border-radius: 0.25rem; /* rounded */
    font-size: 0.875rem; /* text-sm */
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }

  .markdown-content :global(pre) {
    background-color: oklch(var(--b3)); /* Tertiary background - darker */
    color: oklch(var(--bc)); /* Base content color */
    padding: 1rem; /* p-4 */
    border-radius: 0.5rem; /* rounded-lg */
    margin-bottom: 1rem; /* mb-4 */
    overflow-x: auto;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    border: 1px solid oklch(var(--b2));
  }

  .markdown-content :global(pre code) {
    background-color: transparent;
    color: inherit;
    padding: 0;
  }

  .markdown-content :global(strong) {
    font-weight: 700; /* font-bold */
    color: oklch(var(--bc)); /* Full opacity for emphasis */
  }

  .markdown-content :global(em) {
    font-style: italic;
  }

  .markdown-content :global(a) {
    color: oklch(var(--p)); /* Primary color */
    text-decoration: underline;
    transition: color 0.2s ease;
  }

  .markdown-content :global(a:hover) {
    color: oklch(var(--pf)); /* Primary focus color */
  }

  .markdown-content :global(hr) {
    border: none;
    border-top: 1px solid oklch(var(--bc) / 0.2); /* Base content with low opacity */
    margin: 1.5rem 0; /* my-6 */
  }

  /* Table styling */
  .markdown-content :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
    border: 1px solid oklch(var(--bc) / 0.2);
    border-radius: 0.375rem;
    overflow: hidden;
  }

  .markdown-content :global(th),
  .markdown-content :global(td) {
    border: 1px solid oklch(var(--bc) / 0.1);
    padding: 0.5rem;
    text-align: left;
  }

  .markdown-content :global(th) {
    background-color: oklch(var(--b2)); /* Secondary background */
    font-weight: 600;
    color: oklch(var(--bc));
  }

  .markdown-content :global(tbody tr:nth-child(even)) {
    background-color: oklch(var(--b1) / 0.5); /* Subtle zebra striping */
  }

  /* Nested lists */
  .markdown-content :global(ul ul),
  .markdown-content :global(ol ol),
  .markdown-content :global(ul ol),
  .markdown-content :global(ol ul) {
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
    padding-left: 1.5rem;
  }
</style>
