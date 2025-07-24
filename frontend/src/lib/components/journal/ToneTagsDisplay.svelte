<script lang="ts">
  import type { ToneTag } from '$lib/types/journal';
  import { HeartIcon, SmileIcon, ZapIcon, CloudIcon, FrownIcon, FlameIcon, AlertTriangleIcon } from 'lucide-svelte';

  export let toneTags: ToneTag[] | null = null;
  export let size: 'xs' | 'sm' | 'md' = 'sm';
  export let showLabels = true;
  export let maxDisplay = 0; // 0 means show all

  // Map tone tags to colors and icons
  function getToneTagColor(tag: ToneTag): string {
    switch (tag) {
      case 'happy':
        return 'success';
      case 'calm':
        return 'info';
      case 'energized':
        return 'warning';
      case 'overwhelmed':
        return 'error';
      case 'sad':
        return 'neutral';
      case 'angry':
        return 'error';
      case 'anxious':
        return 'warning';
      default:
        return 'ghost';
    }
  }

  function getToneTagIcon(tag: ToneTag) {
    switch (tag) {
      case 'happy':
        return SmileIcon;
      case 'calm':
        return HeartIcon;
      case 'energized':
        return ZapIcon;
      case 'overwhelmed':
        return CloudIcon;
      case 'sad':
        return FrownIcon;
      case 'angry':
        return FlameIcon;
      case 'anxious':
        return AlertTriangleIcon;
      default:
        return SmileIcon;
    }
  }

  function getToneTagLabel(tag: ToneTag): string {
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  }

  $: displayTags = toneTags ? (maxDisplay > 0 && toneTags.length > maxDisplay ? toneTags.slice(0, maxDisplay) : toneTags) : [];

  $: remainingCount = toneTags && maxDisplay > 0 && toneTags.length > maxDisplay ? toneTags.length - maxDisplay : 0;
</script>

{#if toneTags && toneTags.length > 0}
  <div class="flex flex-wrap items-center gap-1" data-testid="tone-tags-display">
    {#each displayTags as tag (tag)}
      <div class="badge badge-{getToneTagColor(tag)} badge-{size} gap-1">
        <svelte:component this={getToneTagIcon(tag)} size={size === 'xs' ? 10 : size === 'sm' ? 12 : 14} />
        {#if showLabels}
          <span>{getToneTagLabel(tag)}</span>
        {/if}
      </div>
    {/each}

    {#if remainingCount > 0}
      <div class="badge badge-ghost badge-{size}">
        +{remainingCount}
      </div>
    {/if}
  </div>
{/if}
