<script lang="ts">
  export let avatar: string | null = null;
  export let name: string = '';
  export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let rounded = true;
  export let clickable = false;

  // Size configurations following DaisyUI avatar classes
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8', 
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg', 
    xl: 'text-xl'
  };

  // Get user initials for placeholder
  $: initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  $: roundedClass = rounded ? 'rounded-full' : 'rounded-lg';
  $: cursorClass = clickable ? 'cursor-pointer hover:scale-105 transition-transform duration-200' : '';
</script>

<div class="avatar placeholder {cursorClass}">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div 
    class="{sizeClasses[size]} bg-base-300 text-base-content {roundedClass}" 
    on:click 
    on:keydown 
    role={clickable ? 'button' : undefined} 
    tabindex={clickable ? 0 : undefined}
  >
    {#if avatar}
      <img src={avatar} alt={name || 'Avatar'} class="{roundedClass} object-cover w-full h-full" />
    {:else}
      <span class="{textSizes[size]} font-medium">{initials || '?'}</span>
    {/if}
  </div>
</div>
