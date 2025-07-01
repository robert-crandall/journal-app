<script lang="ts">
  import type { ComponentType } from 'svelte';

  // Icon props using Svelte 5 syntax
  let { 
    icon,
    size = 20,
    strokeWidth = 2,
    color = 'currentColor',
    className = '',
    title = '',
    absoluteStrokeWidth = false,
    ...restProps
  }: {
    icon: ComponentType;
    size?: number | string;
    strokeWidth?: number;
    color?: string;
    className?: string;
    title?: string;
    absoluteStrokeWidth?: boolean;
    [key: string]: any;
  } = $props();
</script>

{#if icon}
  {@const IconComponent = icon}
  <IconComponent
    {size}
    stroke={color}
    strokeWidth={absoluteStrokeWidth ? strokeWidth : undefined}
    stroke-width={absoluteStrokeWidth ? undefined : strokeWidth}
    class={className}
    {title}
    {...restProps}
  />
{/if}

<!-- Add styles for consistent icon behavior -->
<style>
  :global(.icon) {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  :global(.icon-sm) {
    width: 1rem;
    height: 1rem;
  }
  
  :global(.icon-md) {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  :global(.icon-lg) {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  :global(.icon-xl) {
    width: 2rem;
    height: 2rem;
  }
</style>
