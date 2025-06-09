<script lang="ts">
  import { theme } from '$lib/theme.js';
  
  function toggleTheme() {
    theme.toggle();
  }
</script>

<button 
  class="btn btn-ghost btn-circle"
  onclick={toggleTheme}
  aria-label="Toggle theme"
  title="Toggle theme"
>
  <svg 
    class="w-5 h-5 fill-current" 
    viewBox="0 0 24 24"
  >
    <path d="M12 18c-.89 0-1.74-.2-2.5-.55C11.56 16.5 13 14.42 13 12s-1.44-4.5-3.5-5.45C10.26 6.2 11.11 6 12 6c3.31 0 6 2.69 6 6s-2.69 6-6 6z"/>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" class="opacity-50"/>
  </svg>
</button>
