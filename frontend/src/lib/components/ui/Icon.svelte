<script lang="ts">
  import type { ComponentType } from 'svelte';

  // Icon props
  export let icon: ComponentType;
  export let size: number | string = 20;
  export let strokeWidth: number = 2;
  export let color: string = 'currentColor';
  export let className: string = '';
  
  // Optional title for accessibility
  export let title: string = '';
  
  // Additional Lucide icon props
  export let absoluteStrokeWidth: boolean = false;
</script>

<svelte:component 
  this={icon}
  {size}
  stroke={color}
  strokeWidth={absoluteStrokeWidth ? strokeWidth : undefined}
  stroke-width={absoluteStrokeWidth ? undefined : strokeWidth}
  class={className}
  {title}
  {...$$restProps}
/>

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
