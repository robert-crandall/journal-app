<script lang="ts">
  import { parseMarkdown } from '$lib/utils/markdown';
  import DOMPurify from 'dompurify';

  export let content: string;
  export let classes: string = '';

  $: sanitizedHtml = content ? DOMPurify.sanitize(parseMarkdown(content)) : '';
  $: combinedClasses = classes ? `prose ${classes}` : 'prose';
</script>

{#if sanitizedHtml}
  <div class={combinedClasses}>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html sanitizedHtml}
  </div>
{/if}
