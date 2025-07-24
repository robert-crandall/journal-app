<script context="module" lang="ts">
  import type { SvelteComponent } from 'svelte';
</script>

<script lang="ts">
  import type { HeaderButton } from './HeaderButton';
  export let title: string;
  export let subtitle: string = '';
  export let buttons: HeaderButton[] = [];
  export let icon: any = null;
</script>

<div class="mb-8">
  <div class="flex flex-wrap items-center justify-between gap-4 sm:gap-0">
    <div class="flex min-w-0 flex-1 items-center gap-3">
      {#if icon}
        <svelte:component this={icon} size={32} class="text-primary shrink-0" />
      {/if}
      <div class="min-w-0">
        <h1 class="text-gradient truncate text-2xl font-bold sm:text-3xl">{title}</h1>
        {#if subtitle}
          <p class="text-base-content/70 truncate">{subtitle}</p>
        {/if}
      </div>
    </div>
    <div class="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
      {#each buttons as btn (btn.label)}
        <button class={btn.class ?? 'btn btn-ghost btn-sm w-auto'} title={btn.title ?? btn.label} on:click={btn.onClick}>
          {#if btn.icon}
            <svelte:component this={btn.icon} size={16} />
          {/if}
          {#if btn.showLabel !== false}
            <span class="sm:inline">{btn.label}</span>
          {/if}
        </button>
      {/each}
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
