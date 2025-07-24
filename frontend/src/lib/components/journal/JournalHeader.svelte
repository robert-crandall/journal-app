<script lang="ts">
  import { BookOpenIcon, LayoutGridIcon, LayoutListIcon, PlusIcon, SparklesIcon } from 'lucide-svelte';
  import type { SvelteComponent } from 'svelte';
  export let title: string = 'Journal Dashboard';
  export let total: number = 0;
  export let onSummaries: () => void;
  export let onToggleView: () => void;
  export let onCreate: () => void;
  export let viewMode: 'grid' | 'list' = 'list';
  export let icon: typeof BookOpenIcon | typeof SvelteComponent = BookOpenIcon;
</script>

<div class="mb-8">
  <div class="flex flex-wrap items-center justify-between gap-4 sm:gap-0">
    <div class="flex min-w-0 flex-1 items-center gap-3">
      <svelte:component this={icon} size={32} class="text-primary shrink-0" />
      <div class="min-w-0">
        <h1 class="text-gradient truncate text-2xl font-bold sm:text-3xl">{title}</h1>
        <p class="text-base-content/70 truncate">
          {total}
          {total === 1 ? 'entry' : 'entries'} found
        </p>
      </div>
    </div>

    <div class="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
      <button class="btn btn-ghost btn-sm w-auto" on:click={onSummaries}>
        <SparklesIcon size={16} />
        <span class="sm:inline">Summaries</span>
      </button>

      <button on:click={onToggleView} class="btn btn-ghost btn-sm w-auto" title="Toggle view mode">
        {#if viewMode === 'grid'}
          <LayoutListIcon size={16} />
        {:else}
          <LayoutGridIcon size={16} />
        {/if}
      </button>

      <button on:click={onCreate} class="btn btn-primary w-auto gap-2">
        <PlusIcon size={16} />
        <span class="xs:inline">New Entry</span>
      </button>
    </div>
  </div>
</div>

<style>
  .text-gradient {
    background: linear-gradient(to right, oklch(0.637 0.237 25.331), oklch(0.637 0.237 330));
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
  }
</style>
