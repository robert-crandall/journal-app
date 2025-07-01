<script lang="ts">
  // Card variants and styling
  export let variant: 'default' | 'bordered' | 'compact' | 'glass' | 'image-full' = 'default';
  export let shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md';
  export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  export let hover: boolean = false;
  export let clickable: boolean = false;
  
  // Additional classes
  export let className: string = '';

  // Build card classes
  $: cardClasses = [
    'card',
    'bg-base-100',
    variant === 'bordered' && 'border border-base-300',
    variant === 'compact' && 'card-compact',
    variant === 'glass' && 'glass',
    variant === 'image-full' && 'image-full',
    shadow !== 'none' && `shadow-${shadow}`,
    hover && 'hover:shadow-lg transition-shadow duration-200',
    clickable && 'cursor-pointer hover:scale-[1.02] transition-transform duration-200',
    className
  ].filter(Boolean).join(' ');

  $: bodyClasses = [
    'card-body',
    padding === 'none' && 'p-0',
    padding === 'sm' && 'p-4',
    padding === 'md' && 'p-6',
    padding === 'lg' && 'p-8'
  ].filter(Boolean).join(' ');

  // Handle click events if clickable
  function handleClick(event: MouseEvent) {
    if (clickable) {
      // Dispatch custom click event
      const clickEvent = new CustomEvent('cardClick', {
        detail: { originalEvent: event }
      });
      
      event.currentTarget?.dispatchEvent(clickEvent);
    }
  }
</script>

<div 
  class={cardClasses}
  onclick={handleClick}
  onkeydown={(e) => {
    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick(e as any);
    }
  }}
  role={clickable ? 'button' : undefined}
  {...(clickable ? { tabindex: 0 } : {})}
  {...$$restProps}
>
  {#if $$slots.image}
    <figure class="card-image">
      <slot name="image" />
    </figure>
  {/if}
  
  <div class={bodyClasses}>
    {#if $$slots.title}
      <h2 class="card-title">
        <slot name="title" />
      </h2>
    {/if}
    
    {#if $$slots.default}
      <slot />
    {/if}
    
    {#if $$slots.actions}
      <div class="card-actions justify-end mt-4">
        <slot name="actions" />
      </div>
    {/if}
  </div>
</div>

<style>
  /* Card enhancements */
  :global(.card) {
    transition: all 0.2s ease-in-out;
  }
  
  /* Hover effects for interactive cards */
  :global(.card.cursor-pointer:hover) {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
  
  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    :global(.card.cursor-pointer:hover) {
      transform: none !important;
    }
    
    :global(.card.cursor-pointer:active) {
      transform: scale(0.98);
    }
  }
  
  /* Card image styling */
  :global(.card-image) {
    margin: 0;
  }
  
  :global(.card-image img) {
    width: 100%;
    height: auto;
    object-fit: cover;
  }
</style>
