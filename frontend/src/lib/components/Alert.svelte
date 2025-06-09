<script lang="ts">
  interface Props {
    message: string;
    type?: 'error' | 'warning' | 'info' | 'success';
    dismissible?: boolean;
    onDismiss?: () => void;
    class?: string;
  }
  
  let { 
    message, 
    type = 'error', 
    dismissible = true, 
    onDismiss,
    class: className = '' 
  }: Props = $props();
  
  const typeClasses = {
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info',
    success: 'alert-success'
  };
  
  const icons = {
    error: '⚠️',
    warning: '⚠️',
    info: 'ℹ️',
    success: '✅'
  };
  
  function handleDismiss() {
    onDismiss?.();
  }
</script>

<div class="alert {typeClasses[type]} {className}" role="alert">
  <span class="text-lg">{icons[type]}</span>
  <span class="flex-1">{message}</span>
  {#if dismissible}
    <button 
      class="btn btn-sm btn-ghost" 
      onclick={handleDismiss}
      aria-label="Dismiss alert"
    >
      ✕
    </button>
  {/if}
</div>
