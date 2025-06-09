<script lang="ts">
  interface Props {
    size?: 'sm' | 'md' | 'lg';
    class?: string;
  }
  
  let { size = 'md', class: className = '' }: Props = $props();
  
  const sizeClasses = {
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg'
  };
</script>

<span class="loading loading-spinner {sizeClasses[size]} {className}"></span>
